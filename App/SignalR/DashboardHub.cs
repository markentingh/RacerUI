using Microsoft.AspNetCore.SignalR;
using System.Text.Json;
using System.Text.Json.Serialization;
using RacerUI.Utils;
using RacerUI.Entities;
using RacerUI.Models;

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
                var gameAppInfo = App.Game(game);
                if (gameInfo != null)
                {
                    gameInfo.Title = gameAppInfo.Title;
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
                return new Game { Path = gamePath.Replace("/", "\\") };
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

        public async Task CheckGameAssets(string game)
        {
            await Clients.Caller.SendAsync("update", "Checking game assets for " + game + "...");
            var gameInfo = SQL.GamesRepository.GetByName(game);
            if (gameInfo != null)
            {
#region Check Game Assets
                var gameAppInfo = App.Game(game);
                int i = 0;
                int lastProgress = 0;

                switch (game)
                {
                    // Assetto Corsa ////////////////////////////////////////////////////////
                    case "assetto corsa":

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
                                await Clients.Caller.SendAsync("progress-title", $"{progressTitle}: Checking car # {i}");
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
                                                    if(skin.Drivers == null) skin.Drivers = [];
                                                    if(skin.Name == skinData.DriverName) skinData.DriverName = "";
                                                    
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
                                                        var team = SQL.TeamsRepository.GetByName(skinData.Team);
                                                        if (team == null)
                                                        {
                                                            team = new Team();
                                                            team.Name = skinData.Team;
                                                            team.Id = SQL.TeamsRepository.Add(team);
                                                        }
                                                        car.TeamId = team.Id;
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
                        break;
                }
#endregion

                await Clients.Caller.SendAsync("progress", 0);

                // find children for all cars in the database
                await Clients.Caller.SendAsync("progress-title", "Finding cars that are related to other cars");
                var cars = SQL.CarsRepository.GetAllCarPaths();
                i = 0;
                lastProgress = 0;
                
                foreach (var car in cars)
                {
                    i++;

                    //update progress in UI
                    await Clients.Caller.SendAsync("progress-title", $"Finding cars that are related to other cars: Checking car # {i}");
                    await Clients.Caller.SendAsync("progress-text", $"Finding cars that start with: {car.Path}");
                    var children = SQL.CarsRepository.FindChildren(car);

                    var progress = (int)Math.Floor((100.0 / cars.Count()) * i);
                    if (lastProgress < progress)
                    {
                        lastProgress = progress;
                        await Clients.Caller.SendAsync("progress", progress);
                    }
                }
                await Clients.Caller.SendAsync("cars", JsonSerializer.Serialize(cars));
            }
        }

        public async Task AddGameToLibrary(string game, string path)
        {
            await Clients.Caller.SendAsync("update", "Adding " + game + " to the library");
        }
    }
}
