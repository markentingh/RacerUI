using Microsoft.AspNetCore.SignalR;
using System.Text.Json;
using System.Text.Json.Serialization;
using RacerUI.Utils;
using RacerUI.Entities;
using RacerUI.Models;
using AssettoTools;
using System.Text;

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
            bool verifyCarDetails = true)
        {
            try
            {
                await Clients.Caller.SendAsync("update", "Checking game assets for " + game + "...");
                var gameInfo = SQL.GamesRepository.GetByName(game);
                if (gameInfo != null)
                {

                    if (!checkNewCars) goto skipCheckCars;

                    #region Check Game Content Folder for New Cars
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
                                    car.Skins = new List<CarSkin>();
                                    var skinFolders = Directory.GetDirectories(folder + "\\skins");
                                    foreach (var skinFolder in skinFolders)
                                    {
                                        var skin = new CarSkin();
                                        skin.CarId = car.Id;
                                        skin.Path = skinFolder.Split("\\").Last();
                                        skin.Name = skin.Path;

                                        var skinPath = skinFolder + "\\ui_skin.json";
                                        if (File.Exists(skinPath))
                                        {
                                            var skinJson = File.ReadAllText(skinPath);
                                            try
                                            {
                                                var skinData = JsonSerializer.Deserialize<UISkin>(JsonHelper.CleanRawJson(skinJson), jsonOptions);
                                                if (skinData != null)
                                                {
                                                    skin.Name = !string.IsNullOrEmpty(skinData.Name) ? skinData.Name : skin.Path;
                                                    skin.Number = skinData.Number;
                                                    if (skin.Drivers == null) skin.Drivers = [];
                                                    if (skin.Name == skinData.DriverName) skinData.DriverName = "";

                                                    //find driver by name, or create a driver if neccessary
                                                    if (!string.IsNullOrEmpty(skinData.DriverName))
                                                    {
                                                        var drivers = AssettoCorsaHelper.GetDriverNames(skinData.DriverName);
                                                        foreach (var driverName in drivers)
                                                        {
                                                            try
                                                            {
                                                                var driver = SQL.DriversRepository.GetByName(driverName);
                                                                if (driver == null)
                                                                {
                                                                    driver = new Driver();
                                                                    driver.Name = driverName;
                                                                    driver.Id = SQL.DriversRepository.Add(driver);
                                                                }
                                                                skin.Drivers.Add(driver);
                                                            }
                                                            catch (Exception ex)
                                                            {
                                                                await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                                                            }
                                                        }
                                                    }

                                                    //find team by name, or create team if neccessary
                                                    if (!string.IsNullOrEmpty(skinData.Team))
                                                    {
                                                        try
                                                        {
                                                            var team = SQL.TeamsRepository.GetByName(skinData.Team);
                                                            if (team == null)
                                                            {
                                                                team = new Team();
                                                                team.Name = skinData.Team;
                                                                team.Id = SQL.TeamsRepository.Add(team);
                                                            }
                                                            car.TeamId = team.Id;
                                                        }
                                                        catch (Exception ex)
                                                        {
                                                            await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                                                        }
                                                    }
                                                }

                                            }
                                            catch (Exception ex)
                                            {
                                                await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                                            }
                                        }

                                        car.Skins.Add(skin);
                                    }
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
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

                        //load car pack file to extract data from the car ///////////////////////////////////////////////////////////////////
                        var carInfo = new StringBuilder();
                        UICar uiCar = new UICar(); //from assetto corsa ui_car.json
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
                            // Assetto Corsa ////////////////////////////////////////////////////////

                            var carName = car.Path.Replace("_", " ");
                            int carWeight = 0;
                            bool hasTurbo = false;
                            var suspensionType = "";
                            var tiresName = "";

                            //ui_car.json
                            var uiCarJsonPath = gameInfo.Path + "\\content\\cars\\" + car.Path + "\\ui\\ui_car.json";
                            if (File.Exists(uiCarJsonPath))
                            {
                                try
                                {
                                    var uiCarJson = File.ReadAllText(uiCarJsonPath);
                                    uiCar = JsonSerializer.Deserialize<UICar>(JsonHelper.CleanRawJson(uiCarJson));
                                    if (uiCar != null)
                                    {
                                        if (!string.IsNullOrEmpty(uiCar.Name)) carName = uiCar.Name;
                                        if (!string.IsNullOrEmpty(uiCar.Brand)) carInfo.AppendLine($"* Name: {uiCar.Name}");
                                        if (!string.IsNullOrEmpty(uiCar.Brand)) carInfo.AppendLine($"* Brand: {uiCar.Brand}");
                                        if (!string.IsNullOrEmpty(uiCar.Year)) carInfo.AppendLine($"* Year: {uiCar.Year}");
                                        if (!string.IsNullOrEmpty(uiCar.Country)) carInfo.AppendLine($"* Country: {uiCar.Country}");
                                        if (!string.IsNullOrEmpty(uiCar.Class)) carInfo.AppendLine($"* Class: {uiCar.Class}");
                                        if (!string.IsNullOrEmpty(uiCar.Author)) carInfo.AppendLine($"* Author: {uiCar.Author}");
                                        if (!string.IsNullOrEmpty(uiCar.Version)) carInfo.AppendLine($"* Version: {uiCar.Version}");
                                        if (!string.IsNullOrEmpty(uiCar.Description)) carInfo.AppendLine($"* Description: \n\n{uiCar.Description.Replace("<br>", "\n")} \n\n");
                                        if (uiCar.Tags?.Count > 0) carInfo.AppendLine($"* Tags: {string.Join(", ", uiCar.Tags)}");
                                        if (uiCar.Specs != null)
                                        {
                                            // Extract numeric specs from ui_car.json and update car entity
                                            if (!string.IsNullOrEmpty(uiCar.Specs.Bhp))
                                            {
                                                carInfo.AppendLine($"* BHP: {uiCar.Specs.Bhp}");
                                                // Parse BHP - only extract max value, let AI determine min
                                                var bhpMatch = System.Text.RegularExpressions.Regex.Match(uiCar.Specs.Bhp, @"([0-9]+)");
                                                if (bhpMatch.Success && decimal.TryParse(bhpMatch.Groups[1].Value, out var bhp))
                                                {
                                                    carDetails.MaxBHP = bhp;
                                                }
                                            }
                                            if (!string.IsNullOrEmpty(uiCar.Specs.Torque))
                                            {
                                                carInfo.AppendLine($"* Torque: {uiCar.Specs.Torque}");
                                                // Parse Torque - only extract max value, let AI determine min
                                                var torqueMatch = System.Text.RegularExpressions.Regex.Match(uiCar.Specs.Torque, @"([0-9]+)");
                                                if (torqueMatch.Success && decimal.TryParse(torqueMatch.Groups[1].Value, out var torque))
                                                {
                                                    carDetails.MaxTorque = torque;
                                                }
                                            }
                                            if (!string.IsNullOrEmpty(uiCar.Specs.Weight))
                                            {
                                                carInfo.AppendLine($"* Weight: {uiCar.Specs.Weight}");
                                                // Parse weight (e.g., "1539 kg", "1539")
                                                var weightMatch = System.Text.RegularExpressions.Regex.Match(uiCar.Specs.Weight, @"([0-9]+)");
                                                if (weightMatch.Success && decimal.TryParse(weightMatch.Groups[1].Value, out var weight))
                                                {
                                                    carDetails.Weight = weight;
                                                }
                                            }
                                            if (!string.IsNullOrEmpty(uiCar.Specs.TopSpeed))
                                            {
                                                carInfo.AppendLine($"* Top Speed: {uiCar.Specs.TopSpeed}");
                                                // Parse top speed (e.g., "240+ kph", "300 mph", "240")
                                                var speedMatch = System.Text.RegularExpressions.Regex.Match(uiCar.Specs.TopSpeed, @"([0-9]+)");
                                                if (speedMatch.Success && decimal.TryParse(speedMatch.Groups[1].Value, out var topSpeed))
                                                {
                                                    carDetails.MaxSpeed = topSpeed;
                                                }
                                            }
                                            if (!string.IsNullOrEmpty(uiCar.Specs.Acceleration))
                                            {
                                                carInfo.AppendLine($"* Acceleration: {uiCar.Specs.Acceleration}");
                                            }
                                            if (!string.IsNullOrEmpty(uiCar.Specs.PwRatio))
                                            {
                                                carInfo.AppendLine($"* Power-to-Weight Ratio: {uiCar.Specs.PwRatio}");
                                                // Parse power ratio (e.g., "5.64 kg/hp", "5.64")
                                                var pwRatioMatch = System.Text.RegularExpressions.Regex.Match(uiCar.Specs.PwRatio, @"([0-9]+\.?[0-9]*)");
                                                if (pwRatioMatch.Success && decimal.TryParse(pwRatioMatch.Groups[1].Value, out var pwRatio))
                                                {
                                                    carDetails.PWRatioKgPerHp = pwRatio;
                                                }
                                            }

                                        }
                                    }
                                    else
                                    {
                                        uiCar = new UICar();
                                    }
                                }
                                catch (Exception ex)
                                {
                                    await Clients.Caller.SendAsync("update", $"Error reading ui_car.json for {car.Path}: {ex.Message}");
                                }
                            }

                            //extract all INI files from car acd file
                            var model = new CarDetails
                            {
                                Path = car.Path
                            };

                            try
                            {
                                var acdWorker = new ACDBackend.ACDWorker();
                                var carFiles = acdWorker.getEntries(gameInfo.Path + "\\content\\cars\\" + car.Path);

                                if (carFiles != null)
                                {
                                    foreach (var file in carFiles)
                                    {
                                        if (file.name.EndsWith(".ini", StringComparison.OrdinalIgnoreCase))
                                        {
                                            var iniContent = new Dictionary<string, string>();
                                            using (var reader = new StringReader(file.fileData))
                                            {
                                                string line;
                                                while ((line = reader.ReadLine()) != null)
                                                {
                                                    var parts = line.Split(new[] { '=' }, 2);
                                                    if (parts.Length == 2)
                                                    {
                                                        iniContent[parts[0].Trim()] = parts[1].Trim();
                                                    }
                                                }
                                            }
                                            if (!model.IniFiles.ContainsKey(file.name))
                                            {
                                                model.IniFiles[file.name] = iniContent;
                                            }
                                        }
                                        else
                                        {
                                            model.OtherFiles.Add(file.name);
                                        }
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                            }

                            //generate car info from Assetto Corsa car files data

                            //car.ini
                            try
                            {
                                var carINI = model.IniFiles.ContainsKey("car.ini") ? model.IniFiles["car.ini"] : null;
                                if (carINI != null)
                                {
                                    if (carINI.ContainsKey("SCREEN_NAME") && !string.IsNullOrEmpty(carINI["SCREEN_NAME"]))
                                    {
                                        carName = carINI["SCREEN_NAME"].Split("\t")[0];
                                    }
                                    if (carINI.ContainsKey("TOTALMASS") && int.TryParse(carINI["TOTALMASS"].Split("\t")[0], out var mass))
                                    {
                                        carWeight = mass;
                                    }
                                    if (carINI.ContainsKey("DRIVEREYES"))
                                    {
                                        var driverEyes = carINI["DRIVEREYES"].Split(",", StringSplitOptions.TrimEntries);
                                        if (driverEyes.Length > 1 && float.TryParse(driverEyes[1], out var ypos))
                                        {
                                            if (ypos > 0.8)
                                            {
                                                //right side
                                                carDetails.DriverSide = 1;
                                            }
                                            else if (ypos < 0.5)
                                            {
                                                //left side
                                                carDetails.DriverSide = -1;
                                            }
                                        }
                                    }
                                    if (carINI.ContainsKey("MAX_FUEL") && int.TryParse(carINI["MAX_FUEL"].Split("\t")[0], out var fuel))
                                    {
                                        carDetails.MaxFuel = fuel;
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                            }

                            //drivetrain.ini
                            try
                            {
                                var drivetrainINI = model.IniFiles.ContainsKey("drivetrain.ini") ? model.IniFiles["drivetrain.ini"] : null;
                                if (drivetrainINI != null)
                                {

                                    if (drivetrainINI.ContainsKey("TYPE") && !string.IsNullOrEmpty(drivetrainINI["TYPE"]))
                                    {
                                        if (drivetrainINI["TYPE"].StartsWith("RWD"))
                                        {
                                            carDetails.DriveType = "RWD";
                                        }
                                        else if (drivetrainINI["TYPE"].StartsWith("FWD"))
                                        {
                                            carDetails.DriveType = "FWD";
                                        }
                                    }

                                    if (drivetrainINI.ContainsKey("GEAR_7"))
                                    {
                                        carDetails.Gears = 7;
                                    }
                                    else if (drivetrainINI.ContainsKey("GEAR_6"))
                                    {
                                        carDetails.Gears = 6;
                                    }
                                    else if (drivetrainINI.ContainsKey("GEAR_5"))
                                    {
                                        carDetails.Gears = 5;
                                    }
                                    else if (drivetrainINI.ContainsKey("GEAR_4"))
                                    {
                                        carDetails.Gears = 4;
                                    }
                                    else if (drivetrainINI.ContainsKey("GEAR_3"))
                                    {
                                        carDetails.Gears = 3;
                                    }
                                    else if (drivetrainINI.ContainsKey("GEAR_2"))
                                    {
                                        carDetails.Gears = 2;
                                    }
                                    else if (drivetrainINI.ContainsKey("GEAR_1"))
                                    {
                                        carDetails.Gears = 1;
                                    }
                                    carDetails.Shifter = drivetrainINI.ContainsKey("SUPPORTS_SHIFTER") && drivetrainINI["SUPPORTS_SHIFTER"].StartsWith("1");
                                    carDetails.AutoClutch = drivetrainINI.ContainsKey("USE_ON_CHANGES") && drivetrainINI["USE_ON_CHANGES"].StartsWith("1");
                                }
                            }
                            catch (Exception ex)
                            {
                                await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                            }

                            //engine.ini
                            try
                            {
                                var engineINI = model.IniFiles.ContainsKey("engine.ini") ? model.IniFiles["engine.ini"] : null;
                                if (engineINI != null)
                                {
                                    if (engineINI.ContainsKey("RPM") && int.TryParse(engineINI["RPM"].Split("\t")[0], out var rpm))
                                    {
                                        carDetails.MaxRPM = rpm;
                                    }
                                    if (engineINI.ContainsKey("LIMITER") && int.TryParse(engineINI["LIMITER"].Split("\t")[0], out var limit))
                                    {
                                        carDetails.LimitRPM = limit;
                                    }
                                    if (engineINI.ContainsKey("MAX_BOOST") && float.TryParse(engineINI["MAX_BOOST"].Split("\t")[0], out var maxboost))
                                    {
                                        hasTurbo = maxboost > 0;
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                            }

                            //fuel_cons.ini
                            try
                            {
                                var fuelconsINI = model.IniFiles.ContainsKey("fuel_cons.ini") ? model.IniFiles["fuel_cons.ini"] : null;
                                if (fuelconsINI != null)
                                {
                                    if (fuelconsINI.ContainsKey("KM_PER_LITER") && float.TryParse(fuelconsINI["KM_PER_LITER"].Split("\t")[0], out var kmpl))
                                    {
                                        carDetails.KPL = kmpl;
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                            }



                            //setup.ini
                            try
                            {
                                var setupINI = model.IniFiles.ContainsKey("setup.ini") ? model.IniFiles["setup.ini"] : null;
                                if (setupINI != null)
                                {
                                    if (setupINI.ContainsKey("GEAR_7"))
                                    {
                                        carDetails.Gears = 7;
                                    }
                                    else if (setupINI.ContainsKey("GEAR_6"))
                                    {
                                        carDetails.Gears = 6;
                                    }
                                    else if (setupINI.ContainsKey("GEAR_5"))
                                    {
                                        carDetails.Gears = 5;
                                    }
                                    else if (setupINI.ContainsKey("GEAR_4"))
                                    {
                                        carDetails.Gears = 4;
                                    }
                                    else if (setupINI.ContainsKey("GEAR_3"))
                                    {
                                        carDetails.Gears = 3;
                                    }
                                    else if (setupINI.ContainsKey("GEAR_2"))
                                    {
                                        carDetails.Gears = 2;
                                    }
                                    else if (setupINI.ContainsKey("GEAR_1"))
                                    {
                                        carDetails.Gears = 1;
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                            }

                            //suspensions.ini
                            try
                            {
                                var suspensionsINI = model.IniFiles.ContainsKey("suspensions.ini") ? model.IniFiles["suspensions.ini"] : null;
                                if (suspensionsINI != null)
                                {
                                    if (suspensionsINI.ContainsKey("TYPE")) suspensionType = suspensionsINI["TYPE"];
                                }
                            }
                            catch (Exception ex)
                            {
                                await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                            }

                            //tyres.ini
                            try
                            {
                                var tyresINI = model.IniFiles.ContainsKey("tyres.ini") ? model.IniFiles["tyres.ini"] : null;
                                if (tyresINI != null)
                                {
                                    if (tyresINI.ContainsKey("NAME")) tiresName = tyresINI["NAME"];
                                }
                            }
                            catch (Exception ex)
                            {
                                await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                            }

                            if (!string.IsNullOrEmpty(carName)) carInfo.AppendLine($"* Car Name (from car.ini): {carName}");
                            if (carWeight > 0)
                            {
                                carInfo.AppendLine($"* Weight: {carWeight} kg");
                                // Update weight from car.ini if not already set from ui_car.json
                                if (!carDetails.Weight.HasValue || carDetails.Weight == 0)
                                {
                                    carDetails.Weight = carWeight;
                                }
                            }
                            carInfo.AppendLine($"* Driver Side: {(carDetails.DriverSide == -1 ? "Left" : (carDetails.DriverSide == 1 ? "Right" : "Center"))}");
                            if (carDetails.MaxFuel.HasValue && carDetails.MaxFuel > 0) carInfo.AppendLine($"* Max Fuel: {carDetails.MaxFuel} L");
                            if (!string.IsNullOrEmpty(carDetails.DriveType)) carInfo.AppendLine($"* Drivetrain: {carDetails.DriveType}");
                            if (carDetails.Gears.HasValue && carDetails.Gears > 0) carInfo.AppendLine($"* Gears: {carDetails.Gears}");
                            carInfo.AppendLine($"* Shifter Support: {carDetails.Shifter}");
                            carInfo.AppendLine($"* Auto Clutch: {carDetails.AutoClutch}");
                            if (carDetails.MaxRPM.HasValue && carDetails.MaxRPM > 0) carInfo.AppendLine($"* Max RPM: {carDetails.MaxRPM}");
                            if (carDetails.LimitRPM.HasValue && carDetails.LimitRPM > 0) carInfo.AppendLine($"* RPM Limiter: {carDetails.LimitRPM}");
                            carInfo.AppendLine($"* Turbo: {hasTurbo}");
                            if (carDetails.KPL.HasValue && carDetails.KPL > 0) carInfo.AppendLine($"* Fuel Consumption: {carDetails.KPL} km/L");
                            if (!string.IsNullOrEmpty(suspensionType)) carInfo.AppendLine($"* Suspension Type: {suspensionType}");
                            if (!string.IsNullOrEmpty(tiresName)) carInfo.AppendLine($"* Tires: {tiresName}");
                        }


                        await GetCarDetailsFromAI(carDetails, carInfo.ToString(), uiCar);

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
                    #region Verify Car Data
                    i = 0;
                    lastProgress = 0;
                    filteredCars = cars.Where(c => c.GameId == gameInfo.Id);
                    totalCars = filteredCars.Count();
                    await Clients.Caller.SendAsync("progress-title", $"Verifying details of all cars ({totalCars.ToString("N0")} total)");
                    var allCarClasses = String.Join(", ", Cars.CarClasses.Select(c => c.Name));
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


                        //verify car country based on car_ui.json
                        var foundCountry = false;
                        var uiCarJsonPath = gameInfo.Path + "\\content\\cars\\" + car.Path + "\\ui\\ui_car.json";
                        UICar uiCar = new UICar() { Class = "Unknown" };
                        
                        try
                        {
                            var uiCarJson = File.ReadAllText(uiCarJsonPath);
                            uiCar = JsonSerializer.Deserialize<UICar>(JsonHelper.CleanRawJson(uiCarJson)) ?? new UICar() { Class = "Unknown" };
                            if (uiCar != null && !string.IsNullOrEmpty(uiCar.Country))
                            {
                                var country = Countries.GetCountryCode(uiCar.Country.Length > 2 ? uiCar.Country.Substring(0, 2) : uiCar.Country).ToUpper();
                                if (Countries.IsValidCountryCode(country))
                                {
                                    foundCountry = true;
                                    if (country != carDetails.Country)
                                    {
                                        await Clients.Caller.SendAsync("update", "Changed car Country from " + carDetails.Country + " to " + country + " for " + carDetails.Name);
                                        carDetails.Country = country;
                                        SQL.CarsRepository.UpdateCountry(carDetails.Id, country);
                                    }
                                }
                            }
                        }
                        catch (Exception) { }

                        //verify car country based on car make
                        if (!foundCountry && carDetails.MakeId.HasValue)
                        {
                            var make = SQL.CarMakesRepository.GetById(carDetails.MakeId.Value);
                            if (make != null)
                            {
                                if (carDetails.Country != make.CountryCode && Countries.IsValidCountryCode(make.CountryCode))
                                {
                                    await Clients.Caller.SendAsync("update", "Changed car Country from " + carDetails.Country + " to " + make.CountryCode + " for " + carDetails.Name);
                                    carDetails.Country = make.CountryCode;
                                    SQL.CarsRepository.UpdateCountry(carDetails.Id, make.CountryCode);
                                }
                            }
                        }

                        //check if car class needs to be updated
                        int.TryParse(Cars.GetVersion(carDetails.Version, 0).ToString(), out int carClassVersion);
                        if(carClassVersion < 1){
                            var carClass = Cars.GetCarClass(carDetails.Name, carDetails.Details, "");
                            if (carClass != carDetails.Class || carClass == Cars.Unknown)   
                            {
                                if (carClass == Cars.Unknown)
                                {
                                    //use AI to find the actual class
                                    try
                                    {
                                        var aiClassResponse = await LLMs.Prompt(
                                            "Choose the correct car class that should be selected for the vehicle provided by the user.\n" +
                                            $"Available classes to choose from: [" + allCarClasses + "] \n" +
                                            "Return only the class name you picked as a single string with no additional text or formatting", 
                                            "You are an expert race car enthusiast who plays Assetto Corsa and downloads car mods and is trying to organize your car collection by car class", 
                                            $"Year/Make/Model: {carDetails.Year} {carDetails.Name}\n" + 
                                            $"Country: {Countries.GetName(carDetails.Country)}\n" + 
                                            $"Known Class: {uiCar.Class ?? "Unknown"}\n" +
                                            $"Description: {carDetails.ShortDescription}", 
                                            LLMs.Models.Qwen);
                                        var aiClass = aiClassResponse.Trim();
                                        // Check if AI provided class matches any in our Cars helper
                                        var matchedClass = Cars.GetCarClass(carDetails.Name, carDetails.Details, aiClass);
                                        if (!string.IsNullOrEmpty(matchedClass) && matchedClass != Cars.Unknown && carDetails.Class != matchedClass)
                                        {
                                            await Clients.Caller.SendAsync("update", "Changed car Class from " + carDetails.Class + " to " + matchedClass + " for " + carDetails.Year + " " + carDetails.Name + " from " + Countries.GetName(carDetails.Country) + " using class '" + uiCar.Class + "' and short description " + carDetails.ShortDescription);
                                            carDetails.Class = matchedClass;
                                            SQL.CarsRepository.UpdateClass(carDetails.Id, carDetails.Class);
                                            carDetails.Version = Cars.SetVersion(carDetails.Version, 0, '1');
                                            SQL.CarsRepository.UpdateVersion(carDetails.Id, carDetails.Version);
                                        }
                                    }
                                    catch (Exception ex)
                                    {
                                        await Clients.Caller.SendAsync("update", "Error getting car class from AI: " + ex.Message);
                                    }
                                }
                                else
                                {
                                    carDetails.Class = carClass;
                                    SQL.CarsRepository.UpdateClass(carDetails.Id, carClass);
                                }
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

                        // Check and update car year if needed
                        if (!carDetails.Year.HasValue || carDetails.Year == 0)
                        {
                            var yearPrompt = $"Identify the manufacturing year for a vehicle named '{carDetails.Path.Replace("_", " ")}'. " +
                                              $"Return only the year as a four-digit number with no additional text or formatting.";
                            try
                            {
                                var aiYearResponse = await LLMs.Prompt("You are a racing simulator expert.", "", yearPrompt);
                                if (int.TryParse(aiYearResponse.Trim(), out var aiYear) && aiYear > 1900 && aiYear <= DateTime.Now.Year)
                                {
                                    carDetails.Year = aiYear;
                                    SQL.CarsRepository.UpdateYear(carDetails.Id, carDetails.Year);
                                }
                            }
                            catch (Exception ex)
                            {
                                await Clients.Caller.SendAsync("update", "Error getting car year from AI: " + ex.Message);
                            }
                        }
                        else if (carDetails.Year > 0 && carDetails.Year < 100)
                        {
                            carDetails.Year = 1900 + carDetails.Year;
                            SQL.CarsRepository.UpdateYear(carDetails.Id, carDetails.Year);
                        }

                        // Check and update car make if needed
                        if (!carDetails.MakeId.HasValue)
                        {
                            var carMake = Cars.GetCarMake(carDetails.Name, carDetails.Details);
                            if (!string.IsNullOrEmpty(carMake))
                            {
                                // Check if make exists in database, if not create it
                                var make = SQL.CarMakesRepository.GetByName(carMake);
                                if (make == null)
                                {
                                    make = new CarMake { Name = carMake };
                                    var countryData = Cars.GetCarCountry(carMake);
                                    if (!string.IsNullOrEmpty(countryData.CountryCode))
                                    {
                                        make.CountryCode = countryData.CountryCode;
                                    }
                                    make.Id = SQL.CarMakesRepository.Add(make);
                                }
                                carDetails.MakeId = make.Id;
                                SQL.CarsRepository.UpdateMakeId(carDetails.Id, carDetails.MakeId);

                                // Update car country if available from make
                                if (!string.IsNullOrEmpty(make.CountryCode) && string.IsNullOrEmpty(carDetails.Country))
                                {
                                    carDetails.Country = make.CountryCode;
                                    SQL.CarsRepository.UpdateCountry(carDetails.Id, carDetails.Country);
                                }
                                else if (make != null)
                                {
                                    var countryData = Cars.GetCarCountry(make.Name);
                                    if (!string.IsNullOrEmpty(countryData.CountryCode))
                                    {
                                        carDetails.Country = countryData.CountryCode;
                                        SQL.CarsRepository.UpdateCountry(carDetails.Id, carDetails.Country);
                                        // Update make in database with country data
                                        make.CountryCode = countryData.CountryCode;
                                        SQL.CarMakesRepository.Update(make);
                                    }
                                    else
                                    {
                                        // As a last resort, use AI to get country code
                                        var countryPrompt = $"Identify the 2-digit country code for the car manufacturer named '{make.Name}'. " +
                                                            $"Return only the 2-digit country code with no additional text or formatting.";
                                        try
                                        {
                                            var aiCountryResponse = await LLMs.Prompt("You are a racing simulator expert.", "", countryPrompt);
                                            var aiCountryCode = aiCountryResponse.Trim();
                                            if (!string.IsNullOrEmpty(aiCountryCode) && aiCountryCode.Length == 2)
                                            {
                                                carDetails.Country = aiCountryCode;
                                                SQL.CarsRepository.UpdateCountry(carDetails.Id, carDetails.Country);
                                                make.CountryCode = aiCountryCode;
                                                SQL.CarMakesRepository.Update(make);
                                            }
                                        }
                                        catch (Exception ex)
                                        {
                                            await Clients.Caller.SendAsync("update", "Error getting country code from AI: " + ex.Message);
                                        }
                                    }
                                }
                            }
                            else
                            {
                                var makePrompt = $"Identify the manufacturer or make for a vehicle named '{carDetails.Name}' with the following details: '{carDetails.Details}'. " +
                                                  $"Return only the make name as a single string with no additional text or formatting.";
                                try
                                {
                                    var aiMakeResponse = await LLMs.Prompt("You are a racing simulator expert.", "", makePrompt);
                                    var aiMake = aiMakeResponse.Trim();
                                    if (!string.IsNullOrEmpty(aiMake))
                                    {
                                        // Check if make exists in database, if not create it
                                        var make = SQL.CarMakesRepository.GetByName(aiMake);
                                        if (make == null)
                                        {
                                            make = new CarMake { Name = aiMake };
                                            var countryData = Cars.GetCarCountry(aiMake);
                                            if (!string.IsNullOrEmpty(countryData.CountryCode))
                                            {
                                                make.CountryCode = countryData.CountryCode;
                                            }
                                            make.Id = SQL.CarMakesRepository.Add(make);
                                        }
                                        carDetails.MakeId = make.Id;
                                        SQL.CarsRepository.UpdateMakeId(carDetails.Id, carDetails.MakeId);

                                        // Update car country if available from make
                                        if (!string.IsNullOrEmpty(make.CountryCode) && string.IsNullOrEmpty(carDetails.Country))
                                        {
                                            carDetails.Country = make.CountryCode;
                                            SQL.CarsRepository.UpdateCountry(carDetails.Id, carDetails.Country);
                                        }
                                        else if (make != null)
                                        {
                                            var countryData = Cars.GetCarCountry(make.Name);
                                            if (!string.IsNullOrEmpty(countryData.CountryCode))
                                            {
                                                carDetails.Country = countryData.CountryCode;
                                                SQL.CarsRepository.UpdateCountry(carDetails.Id, carDetails.Country);
                                                // Update make in database with country data
                                                make.CountryCode = countryData.CountryCode;
                                                SQL.CarMakesRepository.Update(make);
                                            }
                                            else
                                            {
                                                // As a last resort, use AI to get country code
                                                var countryPrompt = $"Identify the 2-digit country code for the car manufacturer named '{make.Name}'. " +
                                                                    $"Return only the 2-digit country code with no additional text or formatting.";
                                                try
                                                {
                                                    var aiCountryResponse = await LLMs.Prompt("You are a racing simulator expert.", "", countryPrompt);
                                                    var aiCountryCode = aiCountryResponse.Trim();
                                                    if (!string.IsNullOrEmpty(aiCountryCode) && aiCountryCode.Length == 2)
                                                    {
                                                        carDetails.Country = aiCountryCode;
                                                        SQL.CarsRepository.UpdateCountry(carDetails.Id, carDetails.Country);
                                                        make.CountryCode = aiCountryCode;
                                                        SQL.CarMakesRepository.Update(make);
                                                    }
                                                }
                                                catch (Exception ex)
                                                {
                                                    await Clients.Caller.SendAsync("update", "Error getting country code from AI: " + ex.Message);
                                                }
                                            }
                                        }
                                    }
                                }
                                catch (Exception ex)
                                {
                                    await Clients.Caller.SendAsync("update", "Error getting car make from AI: " + ex.Message);
                                }
                            }
                        }

                        //find or create model
                        if (!carDetails.ModelId.HasValue)
                        {
                            var modelPrompt = $"Identify the model name for a vehicle named '{carDetails.Name}' with the following details: '{carDetails.Details}'. " +
                                              $"Return ONLY the model name without the manufacturer or make name. Do not include the brand/make in your response. " +
                                              $"For example, if the car is 'Ferrari 458 Italia', return only '458 Italia', not 'Ferrari 458 Italia'. " +
                                              $"Return only the model name as a single string with no additional text or formatting.";
                            try
                            {
                                var aiModelResponse = await LLMs.Prompt("You are a racing simulator expert.", "", modelPrompt);
                                var modelName = System.Text.RegularExpressions.Regex.Replace(aiModelResponse.Trim(), @"[^a-zA-Z0-9\s\-]", "").Trim();
                                if (!string.IsNullOrEmpty(modelName))
                                {
                                    var model = SQL.CarModelsRepository.GetByName(modelName);
                                    if (model == null)
                                    {
                                        model = new CarModel { Name = modelName, MakeId = carDetails.MakeId.Value };
                                        model.Id = SQL.CarModelsRepository.Add(model);
                                    }
                                    carDetails.ModelId = model.Id;
                                    SQL.CarsRepository.UpdateModelId(carDetails.Id, carDetails.ModelId);
                                }
                                else
                                {
                                    await Clients.Caller.SendAsync("update", "Error getting car model from AI for " + carDetails.Name + ": AI returned response: " + modelName);
                                }
                            }
                            catch (Exception ex)
                            {
                                await Clients.Caller.SendAsync("update", "Error getting car model from AI: " + ex.Message);
                            }
                        }

                        // If car make exists but country is missing, update country
                        if (carDetails.MakeId.HasValue && string.IsNullOrEmpty(carDetails.Country))
                        {
                            var make = SQL.CarMakesRepository.GetById(carDetails.MakeId.Value);
                            if (make != null && !string.IsNullOrEmpty(make.CountryCode))
                            {
                                carDetails.Country = make.CountryCode;
                                SQL.CarsRepository.UpdateCountry(carDetails.Id, carDetails.Country);
                            }
                            else if (make != null)
                            {
                                var countryData = Cars.GetCarCountry(make.Name);
                                if (!string.IsNullOrEmpty(countryData.CountryCode))
                                {
                                    carDetails.Country = countryData.CountryCode;
                                    SQL.CarsRepository.UpdateCountry(carDetails.Id, carDetails.Country);
                                    // Update make in database with country data
                                    make.CountryCode = countryData.CountryCode;
                                    SQL.CarMakesRepository.Update(make);
                                }
                                else
                                {
                                    // As a last resort, use AI to get country code
                                    var countryPrompt = $"Identify the 2-digit country code for the car manufacturer named '{make.Name}'. " +
                                                        $"Return only the 2-digit country code with no additional text or formatting.";
                                    try
                                    {
                                        var aiCountryResponse = await LLMs.Prompt("You are a racing simulator expert.", "", countryPrompt);
                                        var aiCountryCode = aiCountryResponse.Trim();
                                        if (!string.IsNullOrEmpty(aiCountryCode) && aiCountryCode.Length == 2)
                                        {
                                            carDetails.Country = aiCountryCode;
                                            SQL.CarsRepository.UpdateCountry(carDetails.Id, carDetails.Country);
                                            make.CountryCode = aiCountryCode;
                                            SQL.CarMakesRepository.Update(make);
                                        }
                                    }
                                    catch (Exception ex)
                                    {
                                        await Clients.Caller.SendAsync("update", "Error getting country code from AI: " + ex.Message);
                                    }
                                }
                            }
                        }

                        // Check if car author is part of the car name and extract it if necessary
                        if (!string.IsNullOrEmpty(carDetails.Author) && !string.IsNullOrEmpty(carDetails.Name) && carDetails.Name.Contains(carDetails.Author))
                        {
                            var authorPrompt = $"Extract the clean car name without the author from the vehicle named '{carDetails.Name}' where the author is '{carDetails.Author}'. " +
                                              $"Return only the car name as a single string with no additional text or formatting.";
                            try
                            {
                                var aiNameResponse = await LLMs.Prompt("You are a racing simulator expert.", "", authorPrompt);
                                var cleanName = aiNameResponse.Trim();
                                if (!string.IsNullOrEmpty(cleanName) && cleanName != carDetails.Name)
                                {
                                    carDetails.Name = cleanName;
                                    SQL.CarsRepository.UpdateName(carDetails.Id, carDetails.Name);
                                }
                            }
                            catch (Exception ex)
                            {
                                await Clients.Caller.SendAsync("update", "Error cleaning author from car name with AI: " + ex.Message);
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

                skipVerifyCarDetails:

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

        private async Task GetCarDetailsFromAI(Car car, string carInfo, UICar uiCar)
        {
            if (!string.IsNullOrEmpty(car.Details) && !string.IsNullOrEmpty(car.Country)) return; //already used AI to generate details

            var systemPrompt =
                @$"
You are a racing simulator expert that can provide detailed information about vehicle mods for Assetto Corsa. 
The user will provide information about a specific vehicle mod that they have, and you will generate all
factual data that you know about the car mod, and if the vehicle mod is associated with a real vehicle,
you must provide all the data you have about the real vehicle as well.

#Definitions#
Name: vehicle display name (Make Model Extra). Make sure to clean up the name since this is being used in a video game, so no leading or trailing underscores unless its part of the author name, and no periods or dashes between words
Make: vehicle manufacturer
Model: vehicle model
Extra: any additional information about the vehicle that should be part of the display name, typically found in the car name taken from car.ini
Class: vehicle classification
Author: The person or team that developed the car mod
Country: The country of origin of the car, as a 2 character country code in all caps
Types: an array of strings selected from the available list of types below, selecting only the items that represent the type of vehicle.
Available Types: {string.Join(", ", App.CarTypes.Select(a => a.Name))}
Styles: an array of strings selected from the available list below, selecting only the items that represent the styles applied to the vehicle.
Available Styles: {string.Join(", ", App.CarStylings.Select(a => a.Name))}
Specializations: an array of strings from the available list below, selecting only the items that describe what the vehicle is primarily used for
Available Specializations: {string.Join(", ", App.CarSpecializations.Select(a => a.Name))}
Short Description: one sentence describing the car. Do not mention that it is a mod for a game.
minBHP: The minimum brake horsepower of the vehicle. If a range is provided in the BHP field, use the lower value. If only a single value is provided, estimate a reasonable minimum based on the vehicle type and max BHP. If not provided or cannot be determined, use 0.
minTorque: The minimum torque of the vehicle in Nm. If a range is provided in the Torque field, use the lower value. If only a single value is provided, estimate a reasonable minimum based on the vehicle type and max torque. If not provided or cannot be determined, use 0.
zeroTo100Kmph: Calculate the 0-100 km/h acceleration time in seconds based on the provided acceleration formula. If the acceleration is given as 0-60 mph, convert it to 0-100 km/h. If not provided or cannot be determined, use 0.
zeroTo60mph: Calculate the 0-60 mph acceleration time in seconds based on the provided acceleration formula. If the acceleration is given as 0-100 km/h, convert it to 0-60 mph. If not provided or cannot be determined, use 0.
Details: All biographical details you have about the vehicle itself, including any significant racing event history, media, merchandise, crashes & deaths, and any fun facts you know about the vehicle. Don't mention that it is a mod for a game, but you can mention the unique features that this mod contains.
Credits: any people or teams who were mentioned to help with the vehicle mod (list of features worked on by person or team)
Engine: The official naming of the engine installed into the vehicle. If you don't know, use the engine provided by the stock vehicle, or make a best guess. You must provide manufacturer name of the engine, the volume of the engine, and configuration, such as Inline-4, V6, V8, V12, W12, W16, W20, Straight-8, or whatever custom configuration it is in, and if it is turbocharged, mention that as well as ""Turbo"" or ""Turbocharged"" or ""Twin-Turbo"" or whatever the official naming they use for that engine.
Brakes: The manufacturer & type of brakes installed into the vehicle. If you don't know, use the brakes provided by the stock vehicle, or make a best guess.
Tires: The manufacturer & type of tires installed into the vehicle. If you don't know, use the tires provided by the stock vehicle, or make a best guess.
Suspension: The type of suspension installed into the vehicle. If you don't know, use the suspension provided by the stock vehicle, or make a best guess. Only include the abbreviation (DWB, AXLE, Strut), don't include the word ""suspension"", and if the vehicle uses a more complex suspension system, describe it in a few words less than 25 characters, and if the vehicle uses a separate suspension system for front & rear, name the suspension system for front & rear separately.
Seats: An integer representing the total seats available in the vehicle. take into account that the car my be modified for racing so the back seats might have been removed and replaced with NOS or empty space to make the vehicle lighter.
Driver Side: either left or right
Turbo: If a turbo system is installed in the vehicle, give the manufacturer name & type of turbo installed. If not, leave the field blank
Nitrous: If nitrous is available, give the brand name. If not, leave the field blank
Mod kit: If the vehicle is using a mod kit, provide the product name of the mod kit used. If not, leave the field blank
Team: Team name is typically provided as the first part of the car folder path name

#Rules#
* Separate paragraphs in the details property using two line breaks ""\\n\\n"".
* Only use the provided ""Available Types"" for the types array and don't use anything else. Same goes for Available Styles & Specializations. 
* Double check and make sure that the types array that you create only contains types that were provided in the list of Available Types.
* Don't use parenthesis information in the engine, brakes, tires, suspension, turbo, nitrous, or modkit fields
#Output#
You will output a JSON object (without comments) and nothing before or after the JSON object. Use the following template to output with:
{{
    ""name"": """",
    ""make"": """",
    ""model"": """",
    ""extra"": """",
    ""class"": """",
    ""country"": """",
    ""year"": ####,
    ""author"":"""",
    ""types"": [""""],
    ""styles"": [""""],
    ""specializations"": [""""],
    ""shortDescription"": """",
    ""minBHP"": #,
    ""minTorque"": #,
    ""zeroTo100Kmph"": #,
    ""zeroTo60mph"": #,
    ""details"": """",
    ""credits"": """",
    ""engine"":"""",
    ""brakes"":"""",
    ""tires"":"""",
    ""suspension"":"""",
    ""seats"":1,
    ""driverside"":""left"",
    ""turbo"":"""",
    ""nitrous"":"""",
    ""modkit"":"""",
    ""team"":""""
}};";

            //send prompt to preferred LLM
            AI_CarDetails carDetails = null;
            try
            {
                var response = await LLMs.Prompt(systemPrompt, "", carInfo);
                carDetails = JsonSerializer.Deserialize<AI_CarDetails>(response.Replace("json```", "").Replace("```json", "").Replace("```", ""));
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                return;
            }

            if (carDetails != null)
            {
                //update car details from AI response
                if (string.IsNullOrEmpty(car.Name))
                {
                    try
                    {
                        car.Name = !string.IsNullOrEmpty(carDetails.Name) ? carDetails.Name :
                        (
                            uiCar.Name != null && uiCar.Name.IndexOf(carDetails.Make) == 1 ?
                            (carDetails.Make + " " + uiCar.Name.Split(carDetails.Make, 2)[1].Trim()) :
                            (
                            carDetails.Make + " " + carDetails.Model + " " +
                            carDetails.Extra.Replace(carDetails.Make, "").Replace(carDetails.Model, "").Trim()
                        )
                    );
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (!car.Year.HasValue || car.Year == 0)
                {
                    try
                    {
                        if (carDetails.Year > 0)
                        {
                            car.Year = carDetails.Year;
                        }
                        else if (!string.IsNullOrEmpty(uiCar.Year) && int.TryParse(uiCar.Year, out var yearValue))
                        {
                            car.Year = yearValue;
                        }
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Country))
                {
                    try
                    {
                        car.Country = Countries.GetCountryCode(!string.IsNullOrEmpty(carDetails.Country) && carDetails.Country.Length > 2
                            ? carDetails.Country.Substring(0, 2)
                            : carDetails.Country);
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.ShortDescription))
                {
                    try
                    {
                        car.ShortDescription = carDetails.ShortDescription;
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Author))
                {
                    try
                    {
                        car.Author = !string.IsNullOrEmpty(uiCar.Author) ? uiCar.Author : carDetails.Author;
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Class))
                {
                    try
                    {
                        car.Class = carDetails.Class;
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Details))
                {
                    try
                    {
                        car.Details = carDetails.Details;
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Engine))
                {
                    try
                    {
                        car.Engine = carDetails.Engine.Split("(")[0].Trim();
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Brakes))
                {
                    try
                    {
                        car.Brakes = carDetails.Brakes.Split("(")[0].Trim();
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (!car.Seats.HasValue || car.Seats == 0)
                {
                    try
                    {
                        car.Seats = carDetails.Seats;
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (!car.DriverSide.HasValue || car.DriverSide == 0)
                {
                    try
                    {
                        car.DriverSide = carDetails.DriverSide == "left" ? -1 : (carDetails.DriverSide == "right" ? 1 : 0);
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Turbo))
                {
                    try
                    {
                        car.Turbo = carDetails.Turbo.Split("(")[0].Trim();
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Nitrous))
                {
                    try
                    {
                        car.Nitrous = carDetails.Nitrous.Split("(")[0].Trim();
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Modkit))
                {
                    try
                    {
                        car.Modkit = carDetails.ModKit.Split("(")[0].Trim();
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Credits))
                {
                    try
                    {
                        car.Credits = carDetails.Credits;
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Tires))
                {
                    try
                    {
                        car.Tires = carDetails.Tires.Split("(")[0].Trim();
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Suspension))
                {
                    try
                    {
                        car.Suspension = carDetails.Suspension.Split("(")[0].Trim();
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (carDetails.MinBHP.HasValue && (!car.MinBHP.HasValue || car.MinBHP == 0))
                {
                    try
                    {
                        car.MinBHP = carDetails.MinBHP;
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (carDetails.MinTorque.HasValue && (!car.MinTorque.HasValue || car.MinTorque == 0))
                {
                    try
                    {
                        car.MinTorque = carDetails.MinTorque;
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (carDetails.ZeroTo100Kmph.HasValue && (!car.ZeroTo100kmph.HasValue || car.ZeroTo100kmph == 0))
                {
                    try
                    {
                        car.ZeroTo100kmph = carDetails.ZeroTo100Kmph;
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
                if (carDetails.ZeroTo60mph.HasValue && (!car.ZeroTo60mph.HasValue || car.ZeroTo60mph == 0))
                {
                    try
                    {
                        car.ZeroTo60mph = carDetails.ZeroTo60mph;
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }

                car.IsNew = false;

                //find or create make
                if (!string.IsNullOrEmpty(carDetails.Make))
                {
                    try
                    {
                        var make = SQL.CarMakesRepository.GetByName(carDetails.Make);
                        if (make == null)
                        {
                            make = new CarMake { Name = carDetails.Make };
                            var countryData = Cars.GetCarCountry(carDetails.Make);
                            if (!string.IsNullOrEmpty(countryData.CountryCode))
                            {
                                make.CountryCode = countryData.CountryCode;
                            }
                            make.Id = SQL.CarMakesRepository.Add(make);
                        }
                        car.MakeId = make.Id;

                        // Update car country if available from make
                        if (!string.IsNullOrEmpty(make.CountryCode) && string.IsNullOrEmpty(car.Country))
                        {
                            car.Country = make.CountryCode;
                        }
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }

                //find or create model
                if (!string.IsNullOrEmpty(carDetails.Model))
                {
                    try
                    {
                        var model = SQL.CarModelsRepository.GetByName(carDetails.Model);
                        if (model == null)
                        {
                            model = new CarModel
                            {
                                Name = carDetails.Model,
                                MakeId = car.MakeId.Value
                            };
                            model.Id = SQL.CarModelsRepository.Add(model);
                        }
                        car.ModelId = model.Id;
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }

                //find or create country
                if (!string.IsNullOrEmpty(carDetails.Country))
                {
                    try
                    {
                        var country = SQL.CountryRepository.FindOrCreate(carDetails.Country, "");
                        if (country != null)
                        {
                            car.Country = country.Name;
                        }
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }


                //add types
                if (carDetails.Types != null && carDetails.Types.Count > 0)
                {
                    try
                    {
                        var typeIds = new List<int>();
                        foreach (var typeName in carDetails.Types)
                        {
                            var type = SQL.CarTypesRepository.GetByName(typeName);
                            if (type != null)
                            {
                                typeIds.Add(type.Id);
                            }
                        }
                        SQL.CarTypeMappingRepository.SetForCar(car.Id, typeIds);
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }

                //add stylings
                if (carDetails.Styles != null && carDetails.Styles.Count > 0)
                {
                    try
                    {
                        var styleIds = new List<int>();
                        foreach (var styleName in carDetails.Styles)
                        {
                            var style = SQL.CarStylingRepository.GetByName(styleName);
                            if (style != null)
                            {
                                styleIds.Add(style.Id);
                            }
                        }
                        SQL.CarStylingMappingRepository.SetForCar(car.Id, styleIds);
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }

                //add specializations
                if (carDetails.Specializations != null && carDetails.Specializations.Count > 0)
                {
                    try
                    {
                        var specializationIds = new List<int>();
                        foreach (var specializationName in carDetails.Specializations)
                        {
                            var specialization = SQL.RacingSpecializationsRepository.GetByName(specializationName);
                            if (specialization != null)
                            {
                                specializationIds.Add(specialization.Id);
                            }
                        }
                        SQL.CarSpecializationsRepository.SetForCar(car.Id, specializationIds);
                    }
                    catch (Exception ex)
                    {
                        await Clients.Caller.SendAsync("update", "Error: " + ex.Message);
                    }
                }
            }
        }

        public async Task AddGameToLibrary(string game, string path)
        {
            await Clients.Caller.SendAsync("update", "Adding " + game + " to the library");
        }
    }
}
