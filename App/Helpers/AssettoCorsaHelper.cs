using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Globalization;
using RacerUI.Entities;
using RacerUI.Models;

namespace RacerUI.Helpers
{
    public static class AssettoCorsaHelper
    {
        public static string[] GetDriverNames(string names)
        {
            TextInfo textInfo = CultureInfo.CurrentCulture.TextInfo;
            var namelist = names.Replace("/",",").Replace("-",",").Replace("\\",",").Replace("_", " ")
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(a => a.Trim()).Where(a => a.Length > 0).Distinct()
                .Select(a => textInfo.ToTitleCase(a.ToLower()));
            return namelist.ToArray();
        }

        public static void GetSkins(Car car, string folder)
        {
            car.Skins = new List<CarSkin>();
            var skinFolders = Directory.GetDirectories(folder + "\\skins");
            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                NumberHandling = JsonNumberHandling.AllowReadingFromString,
                AllowTrailingCommas = true
            };
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
                                var drivers = GetDriverNames(skinData.DriverName);
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
                                        Console.WriteLine("Error: " + ex.Message);
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
                                    Console.WriteLine("Error: " + ex.Message);
                                }
                            }
                        }

                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }

                car.Skins.Add(skin);
            }
        }

        public static UICar GetUI_CarJson(string folder)
        {
            var uiCarJson = File.ReadAllText(folder);
            return JsonSerializer.Deserialize<UICar>(JsonHelper.CleanRawJson(uiCarJson));
        }

        public static void GetCarSpecs(Car car, UICar uiCar, string folder)
        {
            var carName = car.Path.Replace("_", " ");

            if (uiCar != null)
            {
                //populate missing car data with ui_car.json data
                if (!string.IsNullOrEmpty(uiCar.Name) && string.IsNullOrEmpty(car.Name))
                {
                    car.Name = uiCar.Name;
                }
                if (!string.IsNullOrEmpty(uiCar.Year) && (!car.Year.HasValue || car.Year <= 0))
                {
                    int.TryParse(uiCar.Year, out var year);
                    car.Year = year;
                }
                if (!string.IsNullOrEmpty(uiCar.Author) && string.IsNullOrEmpty(car.Author))
                {
                    car.Author = uiCar.Author;
                }
                if (!string.IsNullOrEmpty(uiCar.Class) && string.IsNullOrEmpty(car.Class))
                {
                    if ((new List<string>(){ "pro", "tuning", "tuned" }).Contains(uiCar.Class))
                    {

                    }
                    car.Class = uiCar.Class;
                }

                // Extract numeric specs from ui_car.json and update car entity
                if (!string.IsNullOrEmpty(uiCar.Specs.Bhp))
                {
                    // Parse BHP - only extract max value, let AI determine min
                    var bhpMatch = System.Text.RegularExpressions.Regex.Match(uiCar.Specs.Bhp, @"([0-9]+)");
                    if (bhpMatch.Success && decimal.TryParse(bhpMatch.Groups[1].Value, out var bhp))
                    {
                        car.MaxBHP = bhp;
                    }
                }
                if (!string.IsNullOrEmpty(uiCar.Specs.Torque))
                {
                    // Parse Torque - only extract max value, let AI determine min
                    var torqueMatch = System.Text.RegularExpressions.Regex.Match(uiCar.Specs.Torque, @"([0-9]+)");
                    if (torqueMatch.Success && decimal.TryParse(torqueMatch.Groups[1].Value, out var torque))
                    {
                        car.MaxTorque = torque;
                    }
                }
                if (!string.IsNullOrEmpty(uiCar.Specs.Weight))
                {
                    // Parse weight (e.g., "1539 kg", "1539")
                    var weightMatch = System.Text.RegularExpressions.Regex.Match(uiCar.Specs.Weight, @"([0-9]+)");
                    if (weightMatch.Success && decimal.TryParse(weightMatch.Groups[1].Value, out var weight))
                    {
                        car.Weight = weight;
                    }
                }
                if (!string.IsNullOrEmpty(uiCar.Specs.TopSpeed))
                {
                    // Parse top speed (e.g., "240+ kph", "300 mph", "240")
                    var speedMatch = System.Text.RegularExpressions.Regex.Match(uiCar.Specs.TopSpeed, @"([0-9]+)");
                    if (speedMatch.Success && decimal.TryParse(speedMatch.Groups[1].Value, out var topSpeed))
                    {
                        car.MaxSpeed = topSpeed;
                    }
                }
                if (!string.IsNullOrEmpty(uiCar.Specs.PwRatio))
                {
                    // Parse power ratio (e.g., "5.64 kg/hp", "5.64")
                    var pwRatioMatch = System.Text.RegularExpressions.Regex.Match(uiCar.Specs.PwRatio, @"([0-9]+\.?[0-9]*)");
                    if (pwRatioMatch.Success && decimal.TryParse(pwRatioMatch.Groups[1].Value, out var pwRatio))
                    {
                        car.PWRatioKgPerHp = pwRatio;
                    }
                }
            }
            else
            {
                uiCar = new UICar() { Specs = new UICarSpecs() };
            }

            //extract all INI files from car acd file
            var model = new CarDetails
            {
                Path = car.Path
            };

            try
            {
                var acdWorker = new ACDBackend.ACDWorker();
                var carFiles = acdWorker.getEntries(folder + "\\content\\cars\\" + car.Path);

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
                Console.WriteLine("Error: " + ex.Message);
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
                        if (!car.Weight.HasValue || car.Weight == 0)
                        {
                            car.Weight = mass;
                        }
                    }
                    if (carINI.ContainsKey("DRIVEREYES"))
                    {
                        var driverEyes = carINI["DRIVEREYES"].Split(",", StringSplitOptions.TrimEntries);
                        if (driverEyes.Length > 1 && float.TryParse(driverEyes[1], out var ypos))
                        {
                            if (ypos > 0.8)
                            {
                                //right side
                                car.DriverSide = 1;
                            }
                            else if (ypos < 0.5)
                            {
                                //left side
                                car.DriverSide = -1;
                            }
                        }
                    }
                    if (carINI.ContainsKey("MAX_FUEL") && int.TryParse(carINI["MAX_FUEL"].Split("\t")[0], out var fuel))
                    {
                        car.MaxFuel = fuel;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
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
                            car.DriveType = "RWD";
                        }
                        else if (drivetrainINI["TYPE"].StartsWith("FWD"))
                        {
                            car.DriveType = "FWD";
                        }
                    }

                    if (drivetrainINI.ContainsKey("GEAR_7"))
                    {
                        car.Gears = 7;
                    }
                    else if (drivetrainINI.ContainsKey("GEAR_6"))
                    {
                        car.Gears = 6;
                    }
                    else if (drivetrainINI.ContainsKey("GEAR_5"))
                    {
                        car.Gears = 5;
                    }
                    else if (drivetrainINI.ContainsKey("GEAR_4"))
                    {
                        car.Gears = 4;
                    }
                    else if (drivetrainINI.ContainsKey("GEAR_3"))
                    {
                        car.Gears = 3;
                    }
                    else if (drivetrainINI.ContainsKey("GEAR_2"))
                    {
                        car.Gears = 2;
                    }
                    else if (drivetrainINI.ContainsKey("GEAR_1"))
                    {
                        car.Gears = 1;
                    }
                    car.Shifter = drivetrainINI.ContainsKey("SUPPORTS_SHIFTER") && drivetrainINI["SUPPORTS_SHIFTER"].StartsWith("1");
                    car.AutoClutch = drivetrainINI.ContainsKey("USE_ON_CHANGES") && drivetrainINI["USE_ON_CHANGES"].StartsWith("1");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
            }

            //engine.ini
            try
            {
                var engineINI = model.IniFiles.ContainsKey("engine.ini") ? model.IniFiles["engine.ini"] : null;
                if (engineINI != null)
                {
                    if (engineINI.ContainsKey("RPM") && int.TryParse(engineINI["RPM"].Split("\t")[0], out var rpm))
                    {
                        car.MaxRPM = rpm;
                    }
                    if (engineINI.ContainsKey("LIMITER") && int.TryParse(engineINI["LIMITER"].Split("\t")[0], out var limit))
                    {
                        car.LimitRPM = limit;
                    }
                    if (engineINI.ContainsKey("MAX_BOOST") && float.TryParse(engineINI["MAX_BOOST"].Split("\t")[0], out var maxboost))
                    {
                        uiCar.Specs.HasTurbo = maxboost > 0;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
            }

            //fuel_cons.ini
            try
            {
                var fuelconsINI = model.IniFiles.ContainsKey("fuel_cons.ini") ? model.IniFiles["fuel_cons.ini"] : null;
                if (fuelconsINI != null)
                {
                    if (fuelconsINI.ContainsKey("KM_PER_LITER") && float.TryParse(fuelconsINI["KM_PER_LITER"].Split("\t")[0], out var kmpl))
                    {
                        car.KPL = kmpl;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
            }



            //setup.ini
            try
            {
                var setupINI = model.IniFiles.ContainsKey("setup.ini") ? model.IniFiles["setup.ini"] : null;
                if (setupINI != null)
                {
                    if (setupINI.ContainsKey("GEAR_7"))
                    {
                        car.Gears = 7;
                    }
                    else if (setupINI.ContainsKey("GEAR_6"))
                    {
                        car.Gears = 6;
                    }
                    else if (setupINI.ContainsKey("GEAR_5"))
                    {
                        car.Gears = 5;
                    }
                    else if (setupINI.ContainsKey("GEAR_4"))
                    {
                        car.Gears = 4;
                    }
                    else if (setupINI.ContainsKey("GEAR_3"))
                    {
                        car.Gears = 3;
                    }
                    else if (setupINI.ContainsKey("GEAR_2"))
                    {
                        car.Gears = 2;
                    }
                    else if (setupINI.ContainsKey("GEAR_1"))
                    {
                        car.Gears = 1;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
            }

            //suspensions.ini
            try
            {
                var suspensionsINI = model.IniFiles.ContainsKey("suspensions.ini") ? model.IniFiles["suspensions.ini"] : null;
                if (suspensionsINI != null)
                {
                    if (suspensionsINI.ContainsKey("TYPE")) uiCar.Specs.SuspensionType = suspensionsINI["TYPE"];
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
            }

            //tyres.ini
            try
            {
                var tyresINI = model.IniFiles.ContainsKey("tyres.ini") ? model.IniFiles["tyres.ini"] : null;
                if (tyresINI != null)
                {
                    if (tyresINI.ContainsKey("NAME")) uiCar.Specs.Tires = tyresINI["NAME"];
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
            }
        }

        public static string GetCarSpecSheet(Car car, UICar uiCar)
        {
            var carInfo = new StringBuilder();

            if (uiCar != null)
            {
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
                    if (!string.IsNullOrEmpty(uiCar.Specs.Bhp)) carInfo.AppendLine($"* BHP: {uiCar.Specs.Bhp}");
                    if (!string.IsNullOrEmpty(uiCar.Specs.Torque)) carInfo.AppendLine($"* Torque: {uiCar.Specs.Torque}");
                    if (!string.IsNullOrEmpty(uiCar.Specs.Weight)) carInfo.AppendLine($"* Weight: {uiCar.Specs.Weight}");
                    if (!string.IsNullOrEmpty(uiCar.Specs.TopSpeed)) carInfo.AppendLine($"* Top Speed: {uiCar.Specs.TopSpeed}");
                    if (!string.IsNullOrEmpty(uiCar.Specs.Acceleration)) carInfo.AppendLine($"* Acceleration: {uiCar.Specs.Acceleration}");
                    if (!string.IsNullOrEmpty(uiCar.Specs.PwRatio)) carInfo.AppendLine($"* Power-to-Weight Ratio: {uiCar.Specs.PwRatio}");
                }
            }
            carInfo.AppendLine($"* Driver Side: {(car.DriverSide == -1 ? "Left" : (car.DriverSide == 1 ? "Right" : "Center"))}");
            if (car.MaxFuel.HasValue && car.MaxFuel > 0) carInfo.AppendLine($"* Max Fuel: {car.MaxFuel} L");
            if (!string.IsNullOrEmpty(car.DriveType)) carInfo.AppendLine($"* Drivetrain: {car.DriveType}");
            if (car.Gears.HasValue && car.Gears > 0) carInfo.AppendLine($"* Gears: {car.Gears}");
            carInfo.AppendLine($"* Shifter Support: {car.Shifter}");
            carInfo.AppendLine($"* Auto Clutch: {car.AutoClutch}");
            if (car.MaxRPM.HasValue && car.MaxRPM > 0) carInfo.AppendLine($"* Max RPM: {car.MaxRPM}");
            if (car.LimitRPM.HasValue && car.LimitRPM > 0) carInfo.AppendLine($"* RPM Limiter: {car.LimitRPM}");
            carInfo.AppendLine($"* Turbo: {uiCar.Specs.HasTurbo}");
            if (car.KPL.HasValue && car.KPL > 0) carInfo.AppendLine($"* Fuel Consumption: {car.KPL} km/L");
            if (!string.IsNullOrEmpty(uiCar.Specs.SuspensionType)) carInfo.AppendLine($"* Suspension Type: {uiCar.Specs.SuspensionType}");
            if (!string.IsNullOrEmpty(uiCar.Specs.Tires)) carInfo.AppendLine($"* Tires: {uiCar.Specs.Tires}");
            return carInfo.ToString();
        }

        public static async Task VerifyCarDetails(Car car, string folder)
        {
            var foundCountry = false;
            var uiCarJsonPath = folder + "\\content\\cars\\" + car.Path + "\\ui\\ui_car.json";
            UICar uiCar = new UICar() { Class = "Unknown" };

            try
            {
                uiCar = GetUI_CarJson(uiCarJsonPath);
                if (uiCar != null && !string.IsNullOrEmpty(uiCar.Country))
                {
                    var country = CountriesHelper.GetCountryCode(uiCar.Country.Length > 2 ? uiCar.Country.Substring(0, 2) : uiCar.Country).ToUpper();
                    if (CountriesHelper.IsValidCountryCode(country))
                    {
                        foundCountry = true;
                        if (country != car.Country)
                        {
                            car.Country = country;
                            SQL.CarsRepository.UpdateCountry(car.Id, country);
                        }
                    }
                }
            }
            catch (Exception) { }

            //verify car country based on car make
            if (!foundCountry && car.MakeId.HasValue)
            {
                var make = SQL.CarMakesRepository.GetById(car.MakeId.Value);
                if (make != null)
                {
                    if (car.Country != make.CountryCode && CountriesHelper.IsValidCountryCode(make.CountryCode))
                    {
                        car.Country = make.CountryCode;
                        SQL.CarsRepository.UpdateCountry(car.Id, make.CountryCode);
                    }
                }
            }

            //check if car class needs to be updated
            const char LATEST_CLASS_VERSION_CHAR = '2';
            int.TryParse(LATEST_CLASS_VERSION_CHAR.ToString(), out int LATEST_CLASS_VERSION);
            int.TryParse(CarsHelper.GetVersion(car.Version, 0).ToString(), out int carClassVersion);
            if (carClassVersion < LATEST_CLASS_VERSION)
            {
                var carClass = CarsHelper.GetCarClass(
                    car.Name, 
                    car.Details, 
                    !string.IsNullOrEmpty(uiCar?.Class) ? uiCar.Class : "",
                    car.Year ?? 0,
                    car.MaxBHP?.ToString() ?? "",
                    car.Weight?.ToString() ?? "",
                    car.DriveType ?? "");
                if (carClass != car.Class || carClass == CarsHelper.Unknown)
                {
                    if (carClass == CarsHelper.Unknown && uiCar != null)
                    {
                        //use AI to find the actual class
                        GetCarSpecs(car, uiCar, folder);
                        var specSheet = CarsHelper.CleanUnwantedClasses(GetCarSpecSheet(car, uiCar));
                        try
                        {
                            var aiClassResponse = await LLMs.Prompt(
                                "Choose a known official car class for the vehicle provided based on the era in which the car was built and the car specs provided.\n" +
                                "Return the full class name you chose as a single string with no additional text or formatting. \n",
                                "You are an expert race car enthusiast who plays Assetto Corsa and downloads car mods and is trying to organize your car collection by car class",
                                specSheet, LLMs.Models.Qwen);

                            var aiClass = aiClassResponse.Trim();
                            var matchedClass = CarsHelper.GetCarClass(
                                car.Name, 
                                car.Details, 
                                aiClass.ToLower(),
                                car.Year ?? 0,
                                car.MaxBHP?.ToString() ?? "",
                                car.Weight?.ToString() ?? "",
                                car.DriveType ?? "");
                            if (!string.IsNullOrEmpty(matchedClass) && matchedClass != CarsHelper.Unknown && car.Class != matchedClass)
                            {
                                car.Class = matchedClass;
                                SQL.CarsRepository.UpdateClass(car.Id, car.Class);
                                car.Version = CarsHelper.SetVersion(car.Version, 0, LATEST_CLASS_VERSION_CHAR);
                                SQL.CarsRepository.UpdateVersion(car.Id, car.Version);
                            }else if(car.Class == matchedClass)
                            {
                                car.Version = CarsHelper.SetVersion(car.Version, 0, LATEST_CLASS_VERSION_CHAR);
                                SQL.CarsRepository.UpdateVersion(car.Id, car.Version);
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine("Error: " + ex.Message);
                        }
                    }
                    else
                    {
                        car.Class = carClass;
                        SQL.CarsRepository.UpdateClass(car.Id, carClass);
                        car.Version = CarsHelper.SetVersion(car.Version, 0, LATEST_CLASS_VERSION_CHAR);
                        SQL.CarsRepository.UpdateVersion(car.Id, car.Version);
                    }
                }
            }
        }

        public static async Task VerifyCarMissingDetails(Car car)
        {
            // Check and update car year if needed
            if (!car.Year.HasValue || car.Year == 0)
            {
                var yearPrompt = $"Identify the manufacturing year for a vehicle named '{car.Path.Replace("_", " ")}'. " +
                                  $"Return only the year as a four-digit number with no additional text or formatting.";
                try
                {
                    var aiYearResponse = await LLMs.Prompt("You are a racing simulator expert.", "", yearPrompt);
                    if (int.TryParse(aiYearResponse.Trim(), out var aiYear) && aiYear > 1900 && aiYear <= DateTime.Now.Year)
                    {
                        car.Year = aiYear;
                        SQL.CarsRepository.UpdateYear(car.Id, car.Year);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Error: " + ex.Message);
                }
            }
            else if (car.Year > 0 && car.Year < 100)
            {
                car.Year = 1900 + car.Year;
                SQL.CarsRepository.UpdateYear(car.Id, car.Year);
            }

            // Check and update car make if needed
            if (!car.MakeId.HasValue)
            {
                var carMake = CarsHelper.GetCarMake(car.Name, car.Details);
                if (!string.IsNullOrEmpty(carMake))
                {
                    // Check if make exists in database, if not create it
                    var make = SQL.CarMakesRepository.GetByName(carMake);
                    if (make == null)
                    {
                        make = new CarMake { Name = carMake };
                        var countryData = CarsHelper.GetCarCountry(carMake);
                        if (!string.IsNullOrEmpty(countryData.CountryCode))
                        {
                            make.CountryCode = countryData.CountryCode;
                        }
                        make.Id = SQL.CarMakesRepository.Add(make);
                    }
                    car.MakeId = make.Id;
                    SQL.CarsRepository.UpdateMakeId(car.Id, car.MakeId);

                    // Update car country if available from make
                    if (!string.IsNullOrEmpty(make.CountryCode) && string.IsNullOrEmpty(car.Country))
                    {
                        car.Country = make.CountryCode;
                        SQL.CarsRepository.UpdateCountry(car.Id, car.Country);
                    }
                    else if (make != null)
                    {
                        var countryData = CarsHelper.GetCarCountry(make.Name);
                        if (!string.IsNullOrEmpty(countryData.CountryCode))
                        {
                            car.Country = countryData.CountryCode;
                            SQL.CarsRepository.UpdateCountry(car.Id, car.Country);
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
                                    car.Country = aiCountryCode;
                                    SQL.CarsRepository.UpdateCountry(car.Id, car.Country);
                                    make.CountryCode = aiCountryCode;
                                    SQL.CarMakesRepository.Update(make);
                                }
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine("Error: " + ex.Message);
                            }
                        }
                    }
                }
                else
                {
                    var makePrompt = $"Identify the manufacturer or make for a vehicle named '{car.Name}' with the following details: '{car.Details}'. " +
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
                                var countryData = CarsHelper.GetCarCountry(aiMake);
                                if (!string.IsNullOrEmpty(countryData.CountryCode))
                                {
                                    make.CountryCode = countryData.CountryCode;
                                }
                                make.Id = SQL.CarMakesRepository.Add(make);
                            }
                            car.MakeId = make.Id;
                            SQL.CarsRepository.UpdateMakeId(car.Id, car.MakeId);

                            // Update car country if available from make
                            if (!string.IsNullOrEmpty(make.CountryCode) && string.IsNullOrEmpty(car.Country))
                            {
                                car.Country = make.CountryCode;
                                SQL.CarsRepository.UpdateCountry(car.Id, car.Country);
                            }
                            else if (make != null)
                            {
                                var countryData = CarsHelper.GetCarCountry(make.Name);
                                if (!string.IsNullOrEmpty(countryData.CountryCode))
                                {
                                    car.Country = countryData.CountryCode;
                                    SQL.CarsRepository.UpdateCountry(car.Id, car.Country);
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
                                            car.Country = aiCountryCode;
                                            SQL.CarsRepository.UpdateCountry(car.Id, car.Country);
                                            make.CountryCode = aiCountryCode;
                                            SQL.CarMakesRepository.Update(make);
                                        }
                                    }
                                    catch (Exception ex)
                                    {
                                        Console.WriteLine("Error: " + ex.Message);
                                    }
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
            }

            //find or create model
            if (!car.ModelId.HasValue)
            {
                var modelPrompt = $"Identify the model name for a vehicle named '{car.Name}' with the following details: '{car.Details}'. " +
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
                            model = new CarModel { Name = modelName, MakeId = car.MakeId.Value };
                            model.Id = SQL.CarModelsRepository.Add(model);
                        }
                        car.ModelId = model.Id;
                        SQL.CarsRepository.UpdateModelId(car.Id, car.ModelId);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Error: " + ex.Message);
                }
            }

            // If car make exists but country is missing, update country
            if (car.MakeId.HasValue && string.IsNullOrEmpty(car.Country))
            {
                var make = SQL.CarMakesRepository.GetById(car.MakeId.Value);
                if (make != null && !string.IsNullOrEmpty(make.CountryCode))
                {
                    car.Country = make.CountryCode;
                    SQL.CarsRepository.UpdateCountry(car.Id, car.Country);
                }
                else if (make != null)
                {
                    var countryData = CarsHelper.GetCarCountry(make.Name);
                    if (!string.IsNullOrEmpty(countryData.CountryCode))
                    {
                        car.Country = countryData.CountryCode;
                        SQL.CarsRepository.UpdateCountry(car.Id, car.Country);
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
                                car.Country = aiCountryCode;
                                SQL.CarsRepository.UpdateCountry(car.Id, car.Country);
                                make.CountryCode = aiCountryCode;
                                SQL.CarMakesRepository.Update(make);
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine("Error: " + ex.Message);
                        }
                    }
                }
            }

            // Check if car author is part of the car name and extract it if necessary
            if (!string.IsNullOrEmpty(car.Author) && !string.IsNullOrEmpty(car.Name) && car.Name.Contains(car.Author))
            {
                var authorPrompt = $"Extract the clean car name without the author from the vehicle named '{car.Name}' where the author is '{car.Author}'. " +
                                  $"Return only the car name as a single string with no additional text or formatting.";
                try
                {
                    var aiNameResponse = await LLMs.Prompt("You are a racing simulator expert.", "", authorPrompt);
                    var cleanName = aiNameResponse.Trim();
                    if (!string.IsNullOrEmpty(cleanName) && cleanName != car.Name)
                    {
                        car.Name = cleanName;
                        SQL.CarsRepository.UpdateName(car.Id, car.Name);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Error: " + ex.Message);
                }
            }
        }

        /// <summary>
        /// Scans the Assetto Corsa tracks folder and returns a list of track paths
        /// </summary>
        public static List<string> GetTrackFolders(string gamePath)
        {
            var trackFolders = new List<string>();
            var tracksPath = Path.Combine(gamePath, "content", "tracks");
            
            if (!Directory.Exists(tracksPath))
            {
                return trackFolders;
            }

            var directories = Directory.GetDirectories(tracksPath);
            foreach (var dir in directories)
            {
                trackFolders.Add(dir);
            }

            return trackFolders;
        }

        /// <summary>
        /// Repairs common JSON syntax errors in malformed JSON strings
        /// </summary>
        private static string RepairMalformedJson(string json)
        {
            if (string.IsNullOrEmpty(json))
            {
                return json;
            }

            // Remove ": " from the beginning of property values
            // Pattern: "property": ": value" becomes "property": "value"
            var fixedJson = System.Text.RegularExpressions.Regex.Replace(
                json,
                @":\s*([""']):\s+",
                ": $1",
                System.Text.RegularExpressions.RegexOptions.Multiline
            );

            // Remove invalid characters after string values (before comma, }, or ])
            // Pattern: "value" followed by invalid characters before comma/brace/bracket
            // Example: "value"R "next" becomes "value","next"
            fixedJson = System.Text.RegularExpressions.Regex.Replace(
                fixedJson,
                @"([""'])\s*([A-Za-z]+)\s*([,\}\]])",
                "$1$3",
                System.Text.RegularExpressions.RegexOptions.Multiline
            );

            // Remove invalid characters after numbers (before comma, }, or ])
            // Pattern: number followed by invalid characters before comma/brace/bracket
            fixedJson = System.Text.RegularExpressions.Regex.Replace(
                fixedJson,
                @"(\d+)\s*([A-Za-z]+)\s*([,\}\]])",
                "$1$3",
                System.Text.RegularExpressions.RegexOptions.Multiline
            );

            // Remove invalid characters after closing braces/brackets
            // Pattern: } or ] followed by invalid characters before comma/brace/bracket
            fixedJson = System.Text.RegularExpressions.Regex.Replace(
                fixedJson,
                @"([\}\]])\s*([A-Za-z]+)\s*([,\}\]])",
                "$1$3",
                System.Text.RegularExpressions.RegexOptions.Multiline
            );

            // Fix missing commas between properties
            // Pattern: "value" followed by whitespace and then a quote (start of next property)
            // This handles cases like: "property": "value" "nextProperty": "value"
            fixedJson = System.Text.RegularExpressions.Regex.Replace(
                fixedJson,
                @"([""'])\s*\n?\s*([""'][^""':,\{\}\[\]]+[""']\s*:)",
                "$1,$2",
                System.Text.RegularExpressions.RegexOptions.Multiline
            );

            // Fix missing commas after closing braces/brackets before quotes
            // Pattern: } or ] followed by whitespace and then a quote
            fixedJson = System.Text.RegularExpressions.Regex.Replace(
                fixedJson,
                @"([\}\]])\s*\n?\s*([""'])",
                "$1,$2",
                System.Text.RegularExpressions.RegexOptions.Multiline
            );

            // Fix missing commas after numbers/booleans before quotes
            // Pattern: number or boolean followed by whitespace and then a quote
            fixedJson = System.Text.RegularExpressions.Regex.Replace(
                fixedJson,
                @"(\d+|true|false|null)\s*\n?\s*([""'][^""':,\{\}\[\]]+[""']\s*:)",
                "$1,$2",
                System.Text.RegularExpressions.RegexOptions.Multiline
            );

            return fixedJson;
        }

        /// <summary>
        /// Parses ui_track.json file and returns track data
        /// </summary>
        public static Track GetTrackFromJson(string trackFolder, int gameId, string subPath = null)
        {
            string uiTrackPath;
            
            if (!string.IsNullOrEmpty(subPath))
            {
                // Track is in a subfolder within ui directory
                uiTrackPath = Path.Combine(trackFolder, "ui", subPath, "ui_track.json");
            }
            else
            {
                // Track is directly in ui directory
                uiTrackPath = Path.Combine(trackFolder, "ui", "ui_track.json");
            }
            
            if (!File.Exists(uiTrackPath))
            {
                return null;
            }

            try
            {
                var jsonContent = File.ReadAllText(uiTrackPath);
                
                // Repair common JSON syntax errors
                var repairedJson = RepairMalformedJson(jsonContent);
                
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString,
                    AllowTrailingCommas = true,
                    ReadCommentHandling = JsonCommentHandling.Skip
                };
                
                jsonOptions.Converters.Add(new FlexibleStringConverter());
                jsonOptions.Converters.Add(new FlexibleIntConverter());

                UITrack trackData = null;
                
                try
                {
                    trackData = JsonSerializer.Deserialize<UITrack>(JsonHelper.CleanRawJson(repairedJson), jsonOptions);
                }
                catch (JsonException jsonEx)
                {
                    // If JSON parsing fails completely, try to create a minimal track with just the folder name
                    Console.WriteLine($"JSON parsing error for {trackFolder}: {jsonEx.Message}");
                    
                    // Return null for completely malformed JSON - track will be skipped
                    return null;
                }
                
                if (trackData == null)
                {
                    return null;
                }

                var track = new Track
                {
                    GameId = gameId,
                    Name = !string.IsNullOrEmpty(trackData.Name) ? trackData.Name : Path.GetFileName(trackFolder),
                    Path = Path.GetFileName(trackFolder),
                    SubPath = subPath,
                    Country = !string.IsNullOrEmpty(trackData.Country) ? GetCountryCode(trackData.Country) : null,
                    City = !string.IsNullOrEmpty(trackData.City) ? trackData.City : null,
                    Author = !string.IsNullOrEmpty(trackData.Author) ? trackData.Author : null,
                    Version = !string.IsNullOrEmpty(trackData.Version) ? trackData.Version : "1.0",
                    Details = !string.IsNullOrEmpty(trackData.Description) ? trackData.Description : null,
                    Year = trackData.Year.HasValue && trackData.Year.Value > 0 ? trackData.Year : null,
                    IsNew = true,
                    Status = 1
                };

                // Parse length from string (e.g., "6049 km" -> 6049)
                if (!string.IsNullOrEmpty(trackData.Length))
                {
                    var lengthMatch = System.Text.RegularExpressions.Regex.Match(trackData.Length, @"([0-9]+)");
                    if (lengthMatch.Success && int.TryParse(lengthMatch.Groups[1].Value, out var length))
                    {
                        track.Length = length;
                    }
                }

                // Parse width
                if (!string.IsNullOrEmpty(trackData.Width) && int.TryParse(trackData.Width, out var width))
                {
                    track.Width = width;
                }

                // Parse pitboxes
                if (!string.IsNullOrEmpty(trackData.Pitboxes) && int.TryParse(trackData.Pitboxes, out var pitboxes))
                {
                    track.PitBoxes = pitboxes;
                }

                // Set run direction
                track.Run = trackData.Run;

                // Parse geotags for latitude and longitude
                if (trackData.Geotags != null && trackData.Geotags.Count >= 2)
                {
                    track.Latitude = trackData.Geotags[0];
                    track.Longitude = trackData.Geotags[1];
                }

                // Determine track type from tags
                if (trackData.Tags != null && trackData.Tags.Count > 0)
                {
                    var trackType = SQL.TrackTypesRepository.GetByName(trackData.Tags[0]);
                    if (trackType != null)
                    {
                        track.TypeId = trackType.Id;
                    }
                }

                return track;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error parsing track JSON for {trackFolder}: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Converts country name to 2-letter country code
        /// </summary>
        private static string GetCountryCode(string countryName)
        {
            if (string.IsNullOrEmpty(countryName))
            {
                return null;
            }

            // Use CountriesHelper to get country code
            var countryCode = CountriesHelper.GetCountryCode(countryName);
            
            // Validate the country code
            if (!string.IsNullOrEmpty(countryCode) && CountriesHelper.IsValidCountryCode(countryCode))
            {
                return countryCode.ToUpper();
            }
            
            return null;
        }
    }

    /// <summary>
    /// Model for ui_track.json
    /// </summary>
    public class UITrack
    {
        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; }

        [JsonPropertyName("tags")]
        public List<string> Tags { get; set; }

        [JsonPropertyName("country")]
        public string Country { get; set; }

        [JsonPropertyName("city")]
        public string City { get; set; }

        [JsonPropertyName("length")]
        public string Length { get; set; }

        [JsonPropertyName("width")]
        public string Width { get; set; }

        [JsonPropertyName("pitboxes")]
        public string Pitboxes { get; set; }

        [JsonPropertyName("run")]
        public string Run { get; set; }

        [JsonPropertyName("author")]
        public string Author { get; set; }

        [JsonPropertyName("version")]
        public string Version { get; set; }

        [JsonPropertyName("url")]
        public string Url { get; set; }

        [JsonPropertyName("geotags")]
        public List<string> Geotags { get; set; }

        [JsonPropertyName("year")]
        public int? Year { get; set; }
    }

    /// <summary>
    /// Custom JSON converter that accepts both string and number values for string properties
    /// </summary>
    public class FlexibleStringConverter : JsonConverter<string>
    {
        public override string Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String)
            {
                return reader.GetString();
            }
            else if (reader.TokenType == JsonTokenType.Number)
            {
                // Handle numeric values by converting to string
                if (reader.TryGetInt32(out var intValue))
                {
                    return intValue.ToString();
                }
                else if (reader.TryGetDouble(out var doubleValue))
                {
                    return doubleValue.ToString();
                }
            }
            else if (reader.TokenType == JsonTokenType.True || reader.TokenType == JsonTokenType.False)
            {
                return reader.GetBoolean().ToString();
            }
            else if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }
            
            return null;
        }

        public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value);
        }
    }

    /// <summary>
    /// Custom JSON converter that accepts both string and number values for int? properties
    /// </summary>
    public class FlexibleIntConverter : JsonConverter<int?>
    {
        public override int? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Number)
            {
                if (reader.TryGetInt32(out var intValue))
                {
                    return intValue;
                }
            }
            else if (reader.TokenType == JsonTokenType.String)
            {
                var stringValue = reader.GetString();
                if (int.TryParse(stringValue, out var intValue))
                {
                    return intValue;
                }
            }
            else if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }
            
            return null;
        }

        public override void Write(Utf8JsonWriter writer, int? value, JsonSerializerOptions options)
        {
            if (value.HasValue)
            {
                writer.WriteNumberValue(value.Value);
            }
            else
            {
                writer.WriteNullValue();
            }
        }
    }
}
