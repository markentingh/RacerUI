using Microsoft.AspNetCore.SignalR;
using System.Text.Json;
using System.Text.Json.Serialization;
using RacerUI.Helpers;
using RacerUI.Entities;

namespace RacerUI.SignalR
{
    public class DashboardHub : Hub
    {
        public async Task Handshake()
        {
            await Clients.Caller.SendAsync("handshake");
            await Clients.Caller.SendAsync("update", "Connected to RacerUI server v0.1.0");
        }

        public async Task KeepAlive() { }

        public async Task<Game> GetGameDetails(string game)
        {
            await Clients.Caller.SendAsync("update", "Loading game details for " + game + "...");
            try
            {
                var gameInfo = SQL.GamesRepository.GetByName(game);
                if (gameInfo != null)
                {
                    gameInfo.Title = App.Game(game).Title;
                    await Clients.Caller.SendAsync("gameDetails", JsonSerializer.Serialize(gameInfo));
                    return gameInfo;
                }

                //at least return game path if no game info exists

                var gamePath = SteamHelper.GetGameInstallLocation(game);

                if (gamePath == null)
                {
                    gamePath = SteamHelper.GetSteamDirectory();
                    if (gamePath == null)
                    {
                        await Clients.Caller.SendAsync("update", "Steam game path not found for Assetto Corsa");
                        return null;
                    }
                }
                var gameData = new Game { Path = gamePath.Replace("/", "\\") };
                await Clients.Caller.SendAsync("gameDetails", JsonSerializer.Serialize(gameData));
                return gameData;
            }
            catch (Exception e)
            {
                await Clients.Caller.SendAsync("update", "Error loading game details for " + game + ": " + e.Message);
                return null;
            }
        }

        public async Task<Game> SetGamePath(string path, string game)
        {
            await Clients.Caller.SendAsync("update", "Setting game path for " + game + "...");
            if (game == null)
            {
                game = GameHelper.GetGameFromPath(path);
            }
            var gameInfo = SQL.GamesRepository.GetByName(game);
            var gameAppInfo = App.Game(game);
            if (gameInfo == null)
            {
                gameInfo = new Game { Name = game, Path = path };
                gameInfo.Id = SQL.GamesRepository.Add(gameInfo);
            }
            else
            {
                gameInfo.Path = path;
                SQL.GamesRepository.Update(gameInfo);
            }
            gameInfo.Title = gameAppInfo.Title;
            return gameInfo;
        }

        public async Task CheckGameAssets(string game,
            bool checkNewCars = true,
            bool findChildCars = true,
            bool getCarDetails = true,
            bool verifyCarDetails = true,
            bool checkNewTracks = true,
            bool getTrackDetails = true,
            bool verifyTrackDetails = true)
        {
            try
            {
                await Clients.Caller.SendAsync("update", "Checking game assets for " + game + "...");
                var gameInfo = SQL.GamesRepository.GetByName(game);
                if (gameInfo != null)
                {

                    if (!checkNewCars) goto skipCheckCars;

                    #region Check Game Content Folder for New Cars

                    var gameAppInfo = App.Game(game);
                    int i = 0;
                    int lastProgress = 0;

                    if (game == "assetto corsa")
                    {
                        // Assetto Corsa ////////////////////////////////////////////////////////
                        //get a list of all car folders
                        var carFolders = Directory.GetDirectories(gameInfo.Path + "\\content\\cars");
                        int totalFolders = carFolders.Count();
                        var progressTitle = $"Found {totalFolders.ToString("N0")} cars for {gameAppInfo.Title}";
                        await Clients.Caller.SendAsync("progress-title", progressTitle);

                        //start batch processing folders

                        var jsonOptions = new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true,
                            NumberHandling = JsonNumberHandling.AllowReadingFromString,
                            AllowTrailingCommas = true
                        };
                        jsonOptions.Converters.Add(new JsonHelper.NumberToStringConverter());

                        foreach (var folder in carFolders)
                        {
                            try
                            {
                                i++;
                                // Check if client is still connected
                                if (Context.ConnectionAborted.IsCancellationRequested)
                                {
                                    return;
                                }
                                var isNew = false;
                                var carId = folder.Split("\\").Last();
                                //find car in database
                                var car = SQL.CarsRepository.GetByPath(carId);
                                if (car == null)
                                {
                                    //car hasn't been processed yet
                                    isNew = true;
                                    car = new Car();
                                    car.Path = carId;
                                    car.GameId = gameInfo.Id;
                                }
                                else
                                {
                                    try
                                    {
                                        //car exists in database, get details
                                        car = SQL.CarsRepository.GetDetails(car.Id);
                                    }
                                    catch (Exception ex)
                                    {
                                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                                        continue;
                                    }
                                }

                                //update progress in UI
                                await Clients.Caller.SendAsync("progress-title", $"{progressTitle}: Checking car # {i} of {totalFolders.ToString("N0")}");
                                await Clients.Caller.SendAsync("progress-text", $"Checking car: {car.Path}");

                                if (car.Skins == null || car.Skins.Count == 0)
                                {
                                    //add car skins, drivers, & teams to database
                                    AssettoCorsaHelper.GetSkins(car, folder);
                                }

                                try
                                {
                                    if (isNew)
                                    {
                                        SQL.CarsRepository.Add(car);
                                    }
                                    else
                                    {
                                        SQL.CarsRepository.Update(car);
                                    }
                                }
                                catch (Exception ex)
                                {
                                    await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                                }

                                var progress = (int)Math.Floor((100.0 / totalFolders) * i);
                                if (lastProgress < progress)
                                {
                                    lastProgress = progress;
                                    await Clients.Caller.SendAsync("progress", progress);
                                }
                            }
                            catch (Exception ex)
                            {
                                await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                            }
                        }
                    }
                #endregion

                skipCheckCars:
                    //get all car IDs & Path values from database
                    await Clients.Caller.SendAsync("progress", 0);
                    List<Car> cars = new List<Car>();
                    try
                    {
                        cars = SQL.CarsRepository.GetAllCarPaths().ToList();
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                        return;
                    }

                    if (!findChildCars) goto skipFindChildCars;

                    #region Find Child Cars Based On Parent Car Path Name

                    // find children for all cars in the database
                    await Clients.Caller.SendAsync("progress-title", "Finding cars that are related to other cars");
                    i = 0;
                    lastProgress = 0;

                    foreach (var car in cars)
                    {
                        i++;

                        // Check if client is still connected
                        if (Context.ConnectionAborted.IsCancellationRequested)
                        {
                            return;
                        }

                        //update progress in UI
                        await Clients.Caller.SendAsync("progress-title", $"Finding cars that are related to other cars: Checking car # {i}");
                        await Clients.Caller.SendAsync("progress-text", $"Finding cars that start with: {car.Path}");
                        try
                        {
                            var children = SQL.CarsRepository.FindChildren(car);
                        }
                        catch (Exception ex)
                        {
                            await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                        }

                        var progress = (int)Math.Floor((100.0 / cars.Count()) * i);
                        if (lastProgress < progress)
                        {
                            lastProgress = progress;
                            await Clients.Caller.SendAsync("progress", progress);
                        }
                    }
                #endregion

                skipFindChildCars:

                    if (!getCarDetails) goto skipGetCarDetails;

                    #region Get Car Details From AI Prompt

                    await Clients.Caller.SendAsync("progress", 1);
                    // get details about each car by using AI
                    i = 0;
                    lastProgress = 0;
                    var filteredCars = cars.Where(c => c.IsNew && c.GameId == gameInfo.Id);
                    var totalCars = filteredCars.Count();
                    await Clients.Caller.SendAsync("progress-title", $"Using AI to get details about all new cars ({totalCars.ToString("N0")} total)");

                    foreach (var car in filteredCars)
                    {
                        i++;

                        // Check if client is still connected
                        if (Context.ConnectionAborted.IsCancellationRequested)
                        {
                            return;
                        }

                        //update progress in UI
                        await Clients.Caller.SendAsync("progress-title", $"Using AI to get details about each car: Checking car # {i} of {totalCars.ToString("N0")}");
                        await Clients.Caller.SendAsync("progress-text", $"Collecting details about car: {car.Path}");

                        //get car specs based on game
                        var carSpecs = "";
                        Car carDetails = null;
                        try
                        {
                            carDetails = SQL.CarsRepository.GetById(car.Id);
                        }
                        catch (Exception ex)
                        {
                            await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                            continue;
                        }

                        if (carDetails == null) continue;

                        if (game == "assetto corsa")
                        {
                            var uiCarJsonPath = gameInfo.Path + "\\content\\cars\\" + car.Path + "\\ui\\ui_car.json";
                            var uiCar = AssettoCorsaHelper.GetUI_CarJson(uiCarJsonPath);
                            AssettoCorsaHelper.GetCarSpecs(carDetails, uiCar, gameInfo.Path);
                            carSpecs = AssettoCorsaHelper.GetCarSpecSheet(carDetails, uiCar);
                        }

                        await CarsHelper.GetCarDetailsFromAI(carDetails, carSpecs);

                        //finally, update car information in SQL
                        try
                        {
                            SQL.CarsRepository.Update(carDetails);
                        }
                        catch (Exception ex)
                        {
                            await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                        }

                        //wait at least 1 second before hitting the LLM again
                        Thread.Sleep(1000);

                        var progress = (int)Math.Ceiling((100.0 / cars.Count()) * i);
                        if (lastProgress < progress)
                        {
                            lastProgress = progress;
                            await Clients.Caller.SendAsync("progress", progress);
                        }
                    }
                #endregion

                skipGetCarDetails:

                    if (!verifyCarDetails) goto skipVerifyCarDetails;

                    #region Verify All Car Data
                    i = 0;
                    lastProgress = 0;
                    filteredCars = cars.Where(c => c.GameId == gameInfo.Id);
                    totalCars = filteredCars.Count();
                    await Clients.Caller.SendAsync("progress-title", $"Verifying details of all cars ({totalCars.ToString("N0")} total)");
                    foreach (var car in filteredCars)
                    {
                        i++;

                        // Check if client is still connected
                        if (Context.ConnectionAborted.IsCancellationRequested)
                        {
                            return;
                        }

                        //update progress in UI
                        await Clients.Caller.SendAsync("progress-title", $"Verifying details of all cars: Checking car # {i} of {totalCars.ToString("N0")}");
                        await Clients.Caller.SendAsync("progress-text", $"Checking car: {car.Path}");

                        Car carDetails = null;
                        try
                        {
                            carDetails = SQL.CarsRepository.GetById(car.Id);
                        }
                        catch (Exception ex)
                        {
                            await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                            continue;
                        }

                        if (carDetails == null) continue;

                        //check if car name is null
                        if (string.IsNullOrEmpty(carDetails.Name))
                        {
                            await Clients.Caller.SendAsync("update", "Car name is null for car: " + car.Path);
                            SQL.CarsRepository.UpdateIsNew(carDetails.Id, 1);
                            continue;
                        }

                        //verify car details for assetto corsa car
                        if (game == "assetto corsa")
                        {
                            var oldClass = carDetails.Class;
                            await AssettoCorsaHelper.VerifyCarDetails(carDetails, gameInfo.Path);
                            if (oldClass != carDetails.Class)
                            {
                                await Clients.Caller.SendAsync("update", "Changed car Class from " + oldClass + " to " + carDetails.Class + " for " + carDetails.Year + " " + carDetails.Name);
                            }

                        }

                        // Update progress after each car verification
                        var progress = (int)Math.Ceiling((100.0 / totalCars) * i);
                        if (lastProgress < progress)
                        {
                            lastProgress = progress;
                            await Clients.Caller.SendAsync("progress", progress);
                        }
                    }

                    #endregion

                    #region Verify Missing Car Data

                    i = 0;
                    lastProgress = 0;
                    filteredCars = cars.Where(c => (!c.Year.HasValue || c.Year < 100 || !c.MakeId.HasValue || string.IsNullOrEmpty(c.Country)) && c.GameId == gameInfo.Id);
                    totalCars = filteredCars.Count();
                    await Clients.Caller.SendAsync("progress-title", $"Verifying missing details about cars ({totalCars.ToString("N0")} total)");

                    foreach (var car in filteredCars)
                    {
                        i++;

                        // Check if client is still connected
                        if (Context.ConnectionAborted.IsCancellationRequested)
                        {
                            return;
                        }

                        //update progress in UI
                        await Clients.Caller.SendAsync("progress-title", $"Verifying missing details about cars: Checking car # {i} of {totalCars.ToString("N0")}");
                        await Clients.Caller.SendAsync("progress-text", $"Checking car: {car.Path}");

                        Car carDetails = null;
                        try
                        {
                            carDetails = SQL.CarsRepository.GetById(car.Id);
                        }
                        catch (Exception ex)
                        {
                            await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                            continue;
                        }

                        if (carDetails == null) continue;

                        if (game == "assetto corsa")
                        {
                            await AssettoCorsaHelper.VerifyCarMissingDetails(carDetails);
                        }

                        // Update progress after each car verification
                        var progress = (int)Math.Ceiling((100.0 / totalCars) * i);
                        if (lastProgress < progress)
                        {
                            lastProgress = progress;
                            await Clients.Caller.SendAsync("progress", progress);
                        }
                    }
                #endregion

                skipVerifyCarDetails:

                    if (!checkNewTracks) goto skipCheckTracks;

                #region "Scan Tracks"
                    await Clients.Caller.SendAsync("progress-title", $"Scanning tracks...");
                    await Clients.Caller.SendAsync("progress-text", $"");
                    await Clients.Caller.SendAsync("progress", 0);

                    if (game == "assetto corsa")
                    {
                        var trackFolders = AssettoCorsaHelper.GetTrackFolders(gameInfo.Path);
                        var totalTracks = trackFolders.Count;
                        var tracksProcessed = 0;
                        lastProgress = 0;

                        await Clients.Caller.SendAsync("update", $"Found {totalTracks} track folders");

                        foreach (var trackFolder in trackFolders)
                        {
                            tracksProcessed++;

                            try
                            {
                                var trackPath = Path.GetFileName(trackFolder);
                                
                                // Update progress in UI
                                await Clients.Caller.SendAsync("progress-title", $"Scanning tracks: {tracksProcessed} of {totalTracks}");
                                await Clients.Caller.SendAsync("progress-text", $"Checking track: {trackPath}");

                                var uiFolder = Path.Combine(trackFolder, "ui");
                                if (!Directory.Exists(uiFolder))
                                {
                                    continue;
                                }

                                // Check if ui_track.json exists directly in ui folder (single track)
                                var directJsonPath = Path.Combine(uiFolder, "ui_track.json");
                                if (File.Exists(directJsonPath))
                                {
                                    // Single track - no subfolders
                                    var existingTrack = SQL.TracksRepository.GetAll()
                                        .FirstOrDefault(t => t.Path == trackPath && t.SubPath == null && t.GameId == gameInfo.Id);

                                    if (existingTrack == null)
                                    {
                                        var track = AssettoCorsaHelper.GetTrackFromJson(trackFolder, gameInfo.Id);
                                        if (track != null)
                                        {
                                            var trackId = SQL.TracksRepository.Add(track);
                                            await Clients.Caller.SendAsync("update", $"Added new track: {track.Name}");
                                        }
                                    }
                                    else if (existingTrack.IsNew)
                                    {
                                        existingTrack.IsNew = false;
                                        SQL.TracksRepository.Update(existingTrack);
                                    }
                                }
                                else
                                {
                                    // Multiple tracks - check subfolders
                                    var subFolders = Directory.GetDirectories(uiFolder);
                                    if (subFolders.Length > 0)
                                    {
                                        int? parentTrackId = null;

                                        for (i = 0; i < subFolders.Length; i++)
                                        {
                                            var subFolderName = Path.GetFileName(subFolders[i]);
                                            var subJsonPath = Path.Combine(subFolders[i], "ui_track.json");

                                            if (File.Exists(subJsonPath))
                                            {
                                                var existingTrack = SQL.TracksRepository.GetAll()
                                                    .FirstOrDefault(t => t.Path == trackPath && t.SubPath == subFolderName && t.GameId == gameInfo.Id);

                                                if (existingTrack == null)
                                                {
                                                    var track = AssettoCorsaHelper.GetTrackFromJson(trackFolder, gameInfo.Id, subFolderName);
                                                    if (track != null)
                                                    {
                                                        // First track becomes the parent
                                                        if (i == 0)
                                                        {
                                                            track.ParentId = null;
                                                            parentTrackId = SQL.TracksRepository.Add(track);
                                                            await Clients.Caller.SendAsync("update", $"Added parent track: {track.Name} ({subFolderName})");
                                                        }
                                                        else
                                                        {
                                                            // Subsequent tracks are children
                                                            track.ParentId = parentTrackId;
                                                            SQL.TracksRepository.Add(track);
                                                            await Clients.Caller.SendAsync("update", $"Added child track: {track.Name} ({subFolderName})");
                                                        }
                                                    }
                                                }
                                                else
                                                {
                                                    // Track exists - set parentTrackId if this is the first one
                                                    if (i == 0 && existingTrack.ParentId == null)
                                                    {
                                                        parentTrackId = existingTrack.Id;
                                                    }

                                                    if (existingTrack.IsNew)
                                                    {
                                                        existingTrack.IsNew = false;
                                                        SQL.TracksRepository.Update(existingTrack);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                // Update progress after each track
                                var progress = (int)Math.Ceiling((100.0 / totalTracks) * tracksProcessed);
                                if (lastProgress < progress)
                                {
                                    lastProgress = progress;
                                    await Clients.Caller.SendAsync("progress", progress);
                                }
                            }
                            catch (Exception ex)
                            {
                                await Clients.Caller.SendAsync("update", $"Error processing track: {ex.Message}");
                            }
                        }

                        await Clients.Caller.SendAsync("update", $"Track scanning complete. Processed {tracksProcessed} tracks.");
                    }
                #endregion

                skipCheckTracks:

                    if (!getTrackDetails) goto skipGetTrackDetails;

                #region "Get Track Details from AI"
                    await Clients.Caller.SendAsync("progress-title", $"Getting track details from AI...");
                    await Clients.Caller.SendAsync("progress-text", $"");
                    await Clients.Caller.SendAsync("progress", 0);

                    // Get all tracks that need details
                    var allTracks = SQL.TracksRepository.GetAll().Where(t => t.GameId == gameInfo.Id && t.ParentId == null).ToList();
                    var tracksNeedingDetails = allTracks.Where(t => VersionHelper.GetVersion(t.Version, 0) == '0').ToList();

                    var totalTracksForAI = tracksNeedingDetails.Count;
                    var tracksAIProcessed = 0;
                    lastProgress = 0;

                    await Clients.Caller.SendAsync("update", $"Found {totalTracksForAI} tracks needing details");

                    foreach (var track in tracksNeedingDetails)
                    {
                        tracksAIProcessed++;

                        // Check if client is still connected
                        if (Context.ConnectionAborted.IsCancellationRequested)
                        {
                            return;
                        }

                        // Update progress in UI
                        await Clients.Caller.SendAsync("progress-title", $"Getting track details from AI: {tracksAIProcessed} of {totalTracksForAI}");
                        await Clients.Caller.SendAsync("progress-text", $"Processing track: {track.Name}");

                        try
                        {
                            await TracksHelper.GetTrackDetailsFromAI(track);
                            
                            // Update track in database
                            SQL.TracksRepository.Update(track);
                            
                            await Clients.Caller.SendAsync("update", $"Updated track details: {track.Name}");
                        }
                        catch (Exception ex)
                        {
                            await Clients.Caller.SendAsync("update", $"Error getting details for track {track.Name}: {ex.Message}");
                        }

                        // Update progress after each track
                        var progress = (int)Math.Ceiling((100.0 / totalTracksForAI) * tracksAIProcessed);
                        if (lastProgress < progress)
                        {
                            lastProgress = progress;
                            await Clients.Caller.SendAsync("progress", progress);
                        }
                    }

                    await Clients.Caller.SendAsync("update", $"Track AI details complete. Processed {tracksAIProcessed} tracks.");
                #endregion

                skipGetTrackDetails:

                    if (!verifyTrackDetails) goto skipVerifyTrackDetails;

                #region Verify Track Details

                    await Clients.Caller.SendAsync("progress-title", $"Verifying Track Details");
                    await Clients.Caller.SendAsync("progress-text", $"Checking track lengths...");
                    await Clients.Caller.SendAsync("progress", 0);

                    // Get all tracks for this game
                    var allTracksForVerification = SQL.TracksRepository.GetAll().Where(t => t.GameId == gameInfo.Id).ToList();
                    var tracksWithInvalidLength = allTracksForVerification.Where(t => t.Length.HasValue && (t.Length.Value / 1000) > 1000).ToList();

                    var totalTracksToVerify = tracksWithInvalidLength.Count;
                    var tracksVerified = 0;
                    lastProgress = 0;

                    await Clients.Caller.SendAsync("update", $"Found {totalTracksToVerify} tracks with length over 1000 km to verify.");

                    foreach (var track in tracksWithInvalidLength)
                    {
                        try
                        {
                            // Track length is stored in meters, so if Length / 1000 > 1000, it means the value is actually in kilometers
                            // Divide by 1000 to convert from km to meters
                            var correctedLength = track.Length.Value / 1000;
                            
                            await Clients.Caller.SendAsync("update", $"Correcting {track.Name}: {track.Length.Value:F1} m -> {correctedLength:F1} m ({correctedLength / 1000:F1} km)");
                            
                            SQL.TracksRepository.UpdateLength(track.Id, correctedLength);
                            tracksVerified++;
                        }
                        catch (Exception ex)
                        {
                            await Clients.Caller.SendAsync("update", $"Error verifying track {track.Name}: {ex.Message}");
                        }

                        // Update progress after each track
                        if (totalTracksToVerify > 0)
                        {
                            var progress = (int)Math.Ceiling((100.0 / totalTracksToVerify) * tracksVerified);
                            if (lastProgress < progress)
                            {
                                lastProgress = progress;
                                await Clients.Caller.SendAsync("progress", progress);
                            }
                        }
                    }

                    await Clients.Caller.SendAsync("update", $"Track verification complete. Corrected {tracksVerified} tracks.");
                #endregion

                skipVerifyTrackDetails:

                    // Clear available countries and years cache to force refresh on next API call
                    App.AvailableCountries.Clear();
                    App.AvailableYears.Clear();

                    await Clients.Caller.SendAsync("progress-title", $"Done!");
                    await Clients.Caller.SendAsync("progress-text", $"");
                    await Clients.Caller.SendAsync("progress", 100);
                }
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
            }
        }

        public async Task AddGameToLibrary(string game, string path)
        {
            await Clients.Caller.SendAsync("update", "Adding " + game + " to the library");
        }
    }
}
