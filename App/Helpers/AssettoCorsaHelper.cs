using System.Text;
using System.Text.RegularExpressions;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Globalization;
using System.Diagnostics;
using RacerUI.Entities;
using RacerUI.Models;

namespace RacerUI.Helpers
{
    public static class AssettoCorsaHelper
    {
        public static bool RunGame(
            string gamePath,
            string carPath,
            string skinPath,
            string trackPath,
            string trackConfig = "",
            string driverName = "Player",
            int sessionType = 4,
            string sessionName = "Hotlap",
            string spawnSet = "HOTLAP_START",
            int sunAngle = 16,
            int ambientTemp = 26,
            int roadTemp = 32,
            string weatherName = "4_mid_clear",
            int aiLevel = 95,
            int raceLaps = 5,
            int cars = 1,
            int sessionDuration = 0,
            int sessionLaps = 0,
            float timeMultiplier = 1.0f,
            int trackGripStart = 95,
            int trackGripRandomness = 1,
            int trackGripLapGain = 1,
            int trackGripTransfer = 90,
            int launcherType = 2,
            RaceLaunchSettings launch = null)
        {
            try
            {
                // Log incoming parameters
                Console.WriteLine($"RunGame called with:");
                Console.WriteLine($"  gamePath: {gamePath}");
                Console.WriteLine($"  carPath: {carPath}");
                Console.WriteLine($"  skinPath: {skinPath}");
                Console.WriteLine($"  trackPath: {trackPath}");
                Console.WriteLine($"  trackConfig: {trackConfig}");
                
                // Resolve case-sensitive paths for car, track, and skin
                var resolvedCarPath = ResolveCaseSensitivePath(gamePath, "content\\cars", carPath);
                var resolvedTrackPath = ResolveCaseSensitivePath(gamePath, "content\\tracks", trackPath);
                var resolvedTrackConfig = string.IsNullOrEmpty(trackConfig) ? "" : ResolveCaseSensitivePath(Path.Combine(gamePath, "content\\tracks", resolvedTrackPath), "", trackConfig);
                
                string resolvedSkinPath = "";
                if (!string.IsNullOrEmpty(skinPath))
                {
                    resolvedSkinPath = ResolveCaseSensitivePath(Path.Combine(gamePath, "content\\cars", resolvedCarPath), "skins", skinPath);
                }
                
                // Log resolved paths
                Console.WriteLine($"Resolved paths:");
                Console.WriteLine($"  Car: {resolvedCarPath}");
                Console.WriteLine($"  Skin: {resolvedSkinPath}");
                Console.WriteLine($"  Track: {resolvedTrackPath}");
                Console.WriteLine($"  Track Config: {resolvedTrackConfig}");

                // Get AC documents folder path
                var documentsPath = Path.Combine(
                    System.Environment.GetFolderPath(System.Environment.SpecialFolder.MyDocuments),
                    "Assetto Corsa"
                );
                
                var cfgPath = Path.Combine(documentsPath, "cfg");
                var raceIniPath = Path.Combine(cfgPath, "race.ini");

                // Ensure cfg directory exists
                if (!Directory.Exists(cfgPath))
                {
                    Directory.CreateDirectory(cfgPath);
                }

                // Write race.ini configuration file with resolved case-sensitive paths
                WriteRaceIni(raceIniPath, resolvedCarPath, resolvedSkinPath, resolvedTrackPath, resolvedTrackConfig,
                    driverName, sessionType, sessionName, spawnSet, sunAngle,
                    ambientTemp, roadTemp, weatherName, aiLevel, raceLaps, cars,
                    sessionDuration, sessionLaps, timeMultiplier, trackGripStart,
                    trackGripRandomness, trackGripLapGain, trackGripTransfer, launcherType, launch);

                // Publish selected weather controller settings for CSP to read at race start
                if (launch?.WeatherController != null)
                {
                    PublishControllerSettings(launch.WeatherController, launch.ControllerSettings);
                }

                string exePath;
                string launcherName;

                // Determine which executable to launch based on launcher type
                switch (launcherType)
                {
                    case 0: // Direct launch (NaiveStarter)
                        exePath = Path.Combine(gamePath, "acs.exe");
                        launcherName = "Direct Launch";
                        break;
                    
                    case 1: // Official launcher (OfficialStarter)
                        exePath = Path.Combine(gamePath, "AssettoCorsa.exe");
                        launcherName = "Official Launcher";
                        break;
                    
                    case 2: // Steam launch (SteamStarter)
                    default:
                        exePath = Path.Combine(gamePath, "acs.exe");
                        launcherName = "Steam Launch";
                        break;
                }
                
                if (!File.Exists(exePath))
                {
                    Console.WriteLine($"Assetto Corsa executable not found at: {exePath}");
                    return false;
                }

                // Start the game process
                var processStartInfo = new ProcessStartInfo
                {
                    FileName = exePath,
                    WorkingDirectory = gamePath,
                    UseShellExecute = true
                };

                // For Steam launch, we could add Steam protocol support in the future
                // For now, direct launch to acs.exe with Steam overlay should work if Steam is running

                var process = Process.Start(processStartInfo);

                if (process != null)
                {
                    SignalR.GameProcessMonitor.NotifyLaunched(process);
                    Console.WriteLine($"Assetto Corsa launched successfully via {launcherName}. Configuration written to: {raceIniPath}");
                    return true;
                }
                else
                {
                    Console.WriteLine("Failed to start Assetto Corsa process");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error launching Assetto Corsa: {ex.Message}");
                return false;
            }
        }

        private static string ResolveCaseSensitivePath(string basePath, string subFolder, string targetFolder)
        {
            try
            {
                // Construct the full search path
                var searchPath = string.IsNullOrEmpty(subFolder) ? basePath : Path.Combine(basePath, subFolder);
                
                Console.WriteLine($"ResolveCaseSensitivePath: Looking for '{targetFolder}' in '{searchPath}'");
                
                if (!Directory.Exists(searchPath))
                {
                    Console.WriteLine($"  ERROR: Search path does not exist: {searchPath}");
                    return targetFolder; // Return original if path doesn't exist
                }

                // Get all directories in the search path
                var directories = Directory.GetDirectories(searchPath);
                Console.WriteLine($"  Found {directories.Length} directories to search");
                
                // Find the directory that matches case-insensitively
                foreach (var dir in directories)
                {
                    var dirName = Path.GetFileName(dir);
                    if (string.Equals(dirName, targetFolder, StringComparison.OrdinalIgnoreCase))
                    {
                        Console.WriteLine($"  MATCH FOUND: '{dirName}'");
                        // Return the actual case-sensitive folder name
                        return dirName;
                    }
                }
                
                Console.WriteLine($"  NO MATCH: Folder '{targetFolder}' not found in '{searchPath}'");
                Console.WriteLine($"  Returning original value: '{targetFolder}'");
                return targetFolder; // Return original if not found
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  ERROR: Exception resolving case-sensitive path: {ex.Message}");
                return targetFolder; // Return original on error
            }
        }

        private static void WriteRaceIni(
            string iniPath,
            string carPath,
            string skinPath,
            string trackPath,
            string trackConfig,
            string driverName,
            int sessionType,
            string sessionName,
            string spawnSet,
            int sunAngle,
            int ambientTemp,
            int roadTemp,
            string weatherName,
            int aiLevel,
            int raceLaps,
            int cars,
            int sessionDuration,
            int sessionLaps,
            float timeMultiplier,
            int trackGripStart,
            int trackGripRandomness,
            int trackGripLapGain,
            int trackGripTransfer,
            int launcherType,
            RaceLaunchSettings launch = null)
        {
            var ini = new StringBuilder();

            // Quick-drive mode from the footer's Race tab. When set, it fully
            // describes the session layout (ACTools' Game.*Properties mapping);
            // otherwise the positional parameters produce a single session.
            var mode = launch?.Mode;
            var carsCount = cars;
            var aiLevelValue = aiLevel;
            var raceLapsValue = raceLaps;
            var penalties = 0;
            var jumpStartPenalty = 0;
            var opponents = 0;
            if (mode != null)
            {
                penalties = (launch.Penalties ?? true) ? 1 : 0;
                if (mode == "race" || mode == "trackday" || mode == "weekend")
                {
                    opponents = Math.Max(0, launch.Opponents ?? 0);
                    carsCount = opponents + 1;
                    aiLevelValue = launch.AiLevel ?? aiLevel;
                    raceLapsValue = launch.RaceLaps ?? raceLaps;
                    jumpStartPenalty = launch.JumpStartPenalty ?? 0;
                }
                else if (mode == "drag")
                {
                    opponents = 1;
                    carsCount = 2;
                    aiLevelValue = launch.AiLevel ?? 100;
                }
            }
            var ballast = launch?.BallastKg ?? 0;
            var restrictor = launch?.RestrictorPct ?? 0;

            // [RACE] section - Car and track selection
            ini.AppendLine("[RACE]");
            ini.AppendLine($"MODEL={carPath}");
            ini.AppendLine($"SKIN={skinPath}");
            ini.AppendLine($"TRACK={trackPath}");
            ini.AppendLine($"CONFIG_TRACK={trackConfig}");
            ini.AppendLine($"CARS={carsCount}");
            ini.AppendLine($"AI_LEVEL={aiLevelValue}");
            if (mode == null || mode == "race" || mode == "trackday" || mode == "weekend")
            {
                ini.AppendLine($"RACE_LAPS={raceLapsValue}");
            }
            ini.AppendLine("MODEL_CONFIG=");
            ini.AppendLine("DRIFT_MODE=0");
            ini.AppendLine("FIXED_SETUP=0");
            ini.AppendLine($"PENALTIES={penalties}");
            ini.AppendLine($"JUMP_START_PENALTY={jumpStartPenalty}");
            ini.AppendLine();

            // [CAR_0] section - Player car details
            ini.AppendLine("[CAR_0]");
            ini.AppendLine("SETUP=");
            ini.AppendLine($"SKIN={skinPath}");
            ini.AppendLine("MODEL=-");
            ini.AppendLine("MODEL_CONFIG=");
            ini.AppendLine($"BALLAST={ballast.ToString("0.###", System.Globalization.CultureInfo.InvariantCulture)}");
            ini.AppendLine($"RESTRICTOR={restrictor.ToString("0.###", System.Globalization.CultureInfo.InvariantCulture)}");
            ini.AppendLine($"DRIVER_NAME={driverName}");
            ini.AppendLine("NATIONALITY=");
            ini.AppendLine("NATION_CODE=");
            ini.AppendLine();

            // [CAR_1..N] bot grid - opponents are filled from the candidate
            // list (cycling when there are more opponents than candidates),
            // falling back to the player's car; AI level/aggression come from
            // the mode settings (ACTools SetBots)
            var candidates = launch?.Candidates;
            for (var i = 0; i < opponents; i++)
            {
                var candidate = (candidates != null && candidates.Count > 0)
                    ? candidates[i % candidates.Count]
                    : null;
                ini.AppendLine($"[CAR_{i + 1}]");
                ini.AppendLine("SETUP=");
                ini.AppendLine($"SKIN={(candidate?.SkinPath ?? skinPath)}");
                ini.AppendLine($"MODEL={(candidate?.CarPath ?? carPath)}");
                ini.AppendLine("MODEL_CONFIG=");
                ini.AppendLine($"AI_LEVEL={aiLevelValue}");
                ini.AppendLine($"AI_AGGRESSION={launch?.AiAggression ?? 0}");
                ini.AppendLine("DRIVER_NAME=Bot");
                ini.AppendLine("BALLAST=0");
                ini.AppendLine("RESTRICTOR=0");
                ini.AppendLine("NATION_CODE=");
                ini.AppendLine("NATIONALITY=");
                ini.AppendLine();
            }

            // [LIGHTING] section - Time of day
            ini.AppendLine("[LIGHTING]");
            ini.AppendLine($"SUN_ANGLE={sunAngle}");
            ini.AppendLine($"TIME_MULT={timeMultiplier.ToString("F1", System.Globalization.CultureInfo.InvariantCulture)}");
            ini.AppendLine("CLOUD_SPEED=0.200");
            // CSP WeatherFX picks the weather via these keys (same as Content Manager writes)
            if (launch != null)
            {
                ini.AppendLine($"__CM_WEATHER_TYPE={(launch.WeatherType ?? -1)}");
                if (!string.IsNullOrEmpty(launch.WeatherController))
                {
                    ini.AppendLine($"__CM_WEATHER_CONTROLLER={launch.WeatherController}");
                }
            }
            ini.AppendLine();

            // [TEMPERATURE] section - Weather conditions
            ini.AppendLine("[TEMPERATURE]");
            ini.AppendLine($"AMBIENT={ambientTemp}");
            ini.AppendLine($"ROAD={roadTemp}");
            ini.AppendLine();

            // [WEATHER] section
            ini.AppendLine("[WEATHER]");
            ini.AppendLine($"NAME={weatherName}");
            ini.AppendLine();

            // [WIND] section - speed in km/h, direction in degrees
            if (launch?.WindSpeedKmh != null)
            {
                var windSpeed = launch.WindSpeedKmh.Value;
                ini.AppendLine("[WIND]");
                ini.AppendLine($"SPEED_KMH_MIN={windSpeed.ToString("F0", System.Globalization.CultureInfo.InvariantCulture)}");
                ini.AppendLine($"SPEED_KMH_MAX={windSpeed.ToString("F0", System.Globalization.CultureInfo.InvariantCulture)}");
                ini.AppendLine($"DIRECTION_DEG={launch.WindDirectionDeg ?? 0}");
                ini.AppendLine();
            }

            // [HEADER] section
            ini.AppendLine("[HEADER]");
            ini.AppendLine("VERSION=2");
            ini.AppendLine();

            // [DYNAMIC_TRACK] section - Track grip
            ini.AppendLine("[DYNAMIC_TRACK]");
            ini.AppendLine($"SESSION_START={trackGripStart}");
            ini.AppendLine($"RANDOMNESS={trackGripRandomness}");
            ini.AppendLine($"LAP_GAIN={trackGripLapGain}");
            ini.AppendLine($"SESSION_TRANSFER={trackGripTransfer}");
            ini.AppendLine();

            // [REMOTE] section - Online mode (disabled by default)
            ini.AppendLine("[REMOTE]");
            ini.AppendLine("ACTIVE=0");
            ini.AppendLine("SERVER_IP=");
            ini.AppendLine("SERVER_PORT=9600");
            ini.AppendLine("GUID=");
            ini.AppendLine("PASSWORD=");
            ini.AppendLine();

            // [BENCHMARK] section
            ini.AppendLine("[BENCHMARK]");
            ini.AppendLine("ACTIVE=0");
            ini.AppendLine();

            // [REPLAY] section
            ini.AppendLine("[REPLAY]");
            ini.AppendLine("ACTIVE=0");
            ini.AppendLine();

            // [RESTART] section
            ini.AppendLine("[RESTART]");
            ini.AppendLine("ACTIVE=0");
            ini.AppendLine();

            // [OPTIONS] section
            ini.AppendLine("[OPTIONS]");
            ini.AppendLine("USE_MPH=0");
            ini.AppendLine();

            // [LAP_INVALIDATOR] section
            ini.AppendLine("[LAP_INVALIDATOR]");
            ini.AppendLine("ALLOWED_TYRES_OUT=-1");
            ini.AppendLine();

            // [GHOST_CAR] section - only the hotlap mode drives the ghost car
            var ghostPlaying = mode == "hotlap" && (launch?.GhostCar ?? true);
            var ghostRecording = mode == "hotlap" && (launch?.RecordGhostCar ?? ghostPlaying);
            ini.AppendLine("[GHOST_CAR]");
            ini.AppendLine($"RECORDING={(ghostRecording ? 1 : 0)}");
            ini.AppendLine($"PLAYING={(ghostPlaying ? 1 : 0)}");
            ini.AppendLine($"SECONDS_ADVANTAGE={(launch?.GhostCarAdvantage ?? 0).ToString("0.###", System.Globalization.CultureInfo.InvariantCulture)}");
            ini.AppendLine($"LOAD={(ghostPlaying || ghostRecording ? 1 : 0)}");
            ini.AppendLine("FILE=");
            ini.AppendLine("ENABLED=0");
            ini.AppendLine();

            // [GROOVE] section - ACTools grooves practice/race-style sessions
            // harder than the time-attack style modes
            var grooveRaceStyle = mode == null || mode == "practice" || mode == "race" || mode == "trackday" || mode == "weekend";
            ini.AppendLine("[GROOVE]");
            ini.AppendLine("VIRTUAL_LAPS=10");
            ini.AppendLine($"MAX_LAPS={(grooveRaceStyle ? 30 : 1)}");
            ini.AppendLine($"STARTING_LAPS={(grooveRaceStyle ? 0 : 1)}");
            ini.AppendLine();

            // [SESSION_*] sections - per-mode layout (ACTools Game.*Properties)
            if (mode == null)
            {
                ini.AppendLine("[SESSION_0]");
                ini.AppendLine($"NAME={sessionName}");
                ini.AppendLine($"TYPE={sessionType}");
                ini.AppendLine($"DURATION_MINUTES={sessionDuration}");
                ini.AppendLine($"SPAWN_SET={spawnSet}");
                ini.AppendLine();
            }
            else if (mode == "weekend")
            {
                var sessionIndex = 0;
                var practiceDuration = launch?.PracticeDurationMinutes ?? 15;
                var qualificationDuration = launch?.QualificationDurationMinutes ?? 30;
                if (practiceDuration > 0)
                {
                    ini.AppendLine($"[SESSION_{sessionIndex++}]");
                    ini.AppendLine("NAME=Practice");
                    ini.AppendLine("TYPE=1");
                    ini.AppendLine($"DURATION_MINUTES={practiceDuration}");
                    ini.AppendLine("SPAWN_SET=PIT");
                    ini.AppendLine();
                }
                if (qualificationDuration > 0)
                {
                    ini.AppendLine($"[SESSION_{sessionIndex++}]");
                    ini.AppendLine("NAME=Qualifying");
                    ini.AppendLine("TYPE=2");
                    ini.AppendLine($"DURATION_MINUTES={qualificationDuration}");
                    ini.AppendLine("SPAWN_SET=PIT");
                    ini.AppendLine();
                }
                ini.AppendLine($"[SESSION_{sessionIndex}]");
                ini.AppendLine("NAME=Race");
                ini.AppendLine("TYPE=3");
                ini.AppendLine("DURATION_MINUTES=0");
                ini.AppendLine("SPAWN_SET=START");
                ini.AppendLine($"LAPS={raceLapsValue}");
                ini.AppendLine();
            }
            else
            {
                string modeName, modeSpawn;
                int modeType, modeDuration = 0;
                switch (mode)
                {
                    case "practice":
                        modeName = "Practice"; modeType = 1; modeSpawn = launch?.StartType ?? "PIT"; break;
                    case "race":
                        modeName = "Quick Race"; modeType = 3; modeSpawn = "START"; break;
                    case "trackday":
                        modeName = "Track Day"; modeType = 2; modeSpawn = "PIT"; modeDuration = 720; break;
                    case "drift":
                        modeName = "Drift Session"; modeType = 6; modeSpawn = launch?.StartType ?? "PIT"; break;
                    case "timeattack":
                        modeName = "Time Attack"; modeType = 5; modeSpawn = "START"; break;
                    case "drag":
                        modeName = "Drag Race"; modeType = 7; modeSpawn = "START"; break;
                    default:
                        modeName = "Hotlap"; modeType = 4; modeSpawn = "HOTLAP_START"; break;
                }
                ini.AppendLine("[SESSION_0]");
                ini.AppendLine($"NAME={modeName}");
                ini.AppendLine($"TYPE={modeType}");
                if (mode != "drag")
                {
                    ini.AppendLine($"DURATION_MINUTES={modeDuration}");
                }
                ini.AppendLine($"SPAWN_SET={modeSpawn}");
                if (mode == "race")
                {
                    ini.AppendLine($"LAPS={raceLapsValue}");
                    ini.AppendLine($"STARTING_POSITION={launch?.StartingPosition ?? 0}");
                }
                else if (mode == "trackday")
                {
                    ini.AppendLine($"__SPEED_LIMIT={(launch?.SpeedLimitKmh ?? 0).ToString("F0", System.Globalization.CultureInfo.InvariantCulture)}");
                }
                else if (mode == "drag")
                {
                    ini.AppendLine($"MATCHES={launch?.MatchesCount ?? 10}");
                }
                ini.AppendLine();
            }

            // [WIND] fallback - only written when the launch settings didn't
            // already emit a [WIND] section (duplicate sections would override it)
            if (launch?.WindSpeedKmh == null)
            {
                ini.AppendLine("[WIND]");
                ini.AppendLine("SPEED_KMH_MIN=10");
                ini.AppendLine("SPEED_KMH_MAX=10");
                ini.AppendLine("DIRECTION_DEG=0");
                ini.AppendLine();
            }

            // [AUTOSPAWN] section - For official launcher auto-start
            if (launcherType == 1)
            {
                ini.AppendLine("[AUTOSPAWN]");
                ini.AppendLine("ACTIVE=true");
                ini.AppendLine();
            }

            // Write to file
            File.WriteAllText(iniPath, ini.ToString());
        }

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

        /// <summary>
        /// Reads the torque curve lookup table (engine.ini TORQUE_CURVE, usually
        /// power.lut) from a car's data.acd or extracted data folder.
        /// Each line is "rpm|torqueNm".
        /// </summary>
        /// <param name="carFolderPath">Full path to the car folder under content\cars</param>
        /// <returns>Sorted list of (rpm, torqueNm) points, empty when unavailable</returns>
        public static List<(double rpm, double nm)> GetPowerCurve(string carFolderPath)
        {
            var points = new List<(double rpm, double nm)>();

            try
            {
                var acdWorker = new ACDBackend.ACDWorker();
                var files = acdWorker.getEntries(carFolderPath);
                if (files == null) return points;

                // engine.ini may name a different torque curve file than power.lut
                var lutName = "power.lut";
                var engineIni = files.FirstOrDefault(f => f.name.Equals("engine.ini", StringComparison.OrdinalIgnoreCase));
                if (engineIni != null)
                {
                    var match = Regex.Match(engineIni.fileData, @"^\s*TORQUE_CURVE\s*=\s*(\S+)", RegexOptions.Multiline);
                    if (match.Success)
                    {
                        lutName = match.Groups[1].Value.Trim();
                    }
                }

                var lut = files.FirstOrDefault(f => f.name.Equals(lutName, StringComparison.OrdinalIgnoreCase))
                    ?? files.FirstOrDefault(f => f.name.Equals("power.lut", StringComparison.OrdinalIgnoreCase));
                if (lut == null) return points;

                using (var reader = new StringReader(lut.fileData))
                {
                    string line;
                    while ((line = reader.ReadLine()) != null)
                    {
                        var parts = line.Split('|');
                        if (parts.Length < 2) continue;
                        if (double.TryParse(parts[0].Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var rpm)
                            && double.TryParse(parts[1].Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var nm))
                        {
                            points.Add((rpm, nm));
                        }
                    }
                }

                points.Sort((a, b) => a.rpm.CompareTo(b.rpm));
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
            }

            return points;
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
            int.TryParse(VersionHelper.GetVersion(car.Version, 0).ToString(), out int carClassVersion);
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
                                car.Version = VersionHelper.SetVersion(car.Version, 0, LATEST_CLASS_VERSION_CHAR);
                                SQL.CarsRepository.UpdateVersion(car.Id, car.Version);
                            }else if(car.Class == matchedClass)
                            {
                                car.Version = VersionHelper.SetVersion(car.Version, 0, LATEST_CLASS_VERSION_CHAR);
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
                        car.Version = VersionHelper.SetVersion(car.Version, 0, LATEST_CLASS_VERSION_CHAR);
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

        // Layout name patterns ported from ACTools' TrackObject.GetPreferredMainLayout
        private static readonly Regex NonDefaultLayoutRegex = new Regex(
            "downhill|drift|fall|freeroam|grid|mini|no ?chicane|osrw|oval|pursuit|rev(?:\\b|erse)?",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);
        private static readonly Regex PreferredLayoutRegex = new Regex(
            "circuit|international|full|gp|grand?|hill ?climb|main|normal|standar[dt]?|uphill",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static int GetLayoutMatchWeight(Match match)
        {
            var value = match.Value.ToLowerInvariant();
            if (value == "full" || value == "drift" || value == "normal" || value == "pursuit") return 10;
            if (value == "international" || value == "circuit") return 2;
            return value.Length;
        }

        /// <summary>
        /// Minimal ini parser: returns sections mapped to key/value dictionaries
        /// </summary>
        public static Dictionary<string, Dictionary<string, string>> ParseIniFile(string iniPath)
        {
            var sections = new Dictionary<string, Dictionary<string, string>>(StringComparer.OrdinalIgnoreCase);
            if (!File.Exists(iniPath))
            {
                return sections;
            }

            var current = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            sections[""] = current;

            foreach (var line in File.ReadAllLines(iniPath))
            {
                var trimmed = line.Trim();
                if (trimmed.StartsWith("[") && trimmed.EndsWith("]"))
                {
                    current = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                    sections[trimmed.Substring(1, trimmed.Length - 2).Trim()] = current;
                }
                else
                {
                    var eq = trimmed.IndexOf('=');
                    if (eq > 0)
                    {
                        var key = trimmed.Substring(0, eq).Trim();
                        var value = trimmed.Substring(eq + 1);
                        var comment = value.IndexOf(';');
                        if (comment >= 0)
                        {
                            value = value.Substring(0, comment);
                        }
                        current[key] = value.Trim();
                    }
                }
            }

            return sections;
        }

        /// <summary>
        /// Enumerates CSP weather controllers from extension/weather-controllers
        /// (folders containing controller.lua), reading manifest.ini for display info
        /// </summary>
        public static List<object> GetWeatherControllers(string gamePath)
        {
            var result = new List<object>();
            var dir = Path.Combine(gamePath, "extension", "weather-controllers");
            if (!Directory.Exists(dir))
            {
                return result;
            }

            foreach (var controllerDir in Directory.GetDirectories(dir))
            {
                if (!File.Exists(Path.Combine(controllerDir, "controller.lua")))
                {
                    continue;
                }

                var manifest = ParseIniFile(Path.Combine(controllerDir, "manifest.ini"));
                manifest.TryGetValue("ABOUT", out var about);

                result.Add(new
                {
                    id = Path.GetFileName(controllerDir),
                    name = about != null && about.TryGetValue("NAME", out var name) && !string.IsNullOrEmpty(name)
                        ? name
                        : Path.GetFileName(controllerDir),
                    followsWeather = !(about != null && about.TryGetValue("FOLLOWS_SELECTED_WEATHER", out var fw) && fw == "0"),
                    hasSettings = File.Exists(Path.Combine(controllerDir, "settings.ini"))
                });
            }

            return result;
        }

        /// <summary>
        /// Parses a weather controller's settings.ini into a list of UI field descriptors.
        /// Specs are declared via ini commentary, the same conventions Content Manager uses:
        ///   KEY=default ; label ; 1 or 0                -> bool
        ///   KEY=default ; label ; "A" is 1, "B" is 2    -> select
        ///   KEY=default ; label ; from X to Y           -> number range
        ///   otherwise                                   -> text
        /// </summary>
        public static List<object> GetControllerSettingsFields(string gamePath, string controllerId)
        {
            var fields = new List<object>();
            var iniPath = Path.Combine(gamePath, "extension", "weather-controllers", controllerId, "settings.ini");
            if (!File.Exists(iniPath))
            {
                return fields;
            }

            var section = "";
            foreach (var rawLine in File.ReadAllLines(iniPath))
            {
                var line = rawLine.Trim();
                if (line.StartsWith("[") && line.EndsWith("]"))
                {
                    section = line.Substring(1, line.Length - 2).Trim();
                    continue;
                }

                var eq = line.IndexOf('=');
                if (eq <= 0)
                {
                    continue;
                }

                var key = line.Substring(0, eq).Trim();
                var parts = line.Substring(eq + 1).Split(';');
                var defaultValue = parts[0].Trim();
                var label = parts.Length > 1 && !string.IsNullOrWhiteSpace(parts[1]) ? parts[1].Trim() : key;
                var spec = parts.Length > 2 ? parts[2].Trim() : "";

                // Long commentary is a description, not a label - move it to a
                // tooltip hint and use the prettified key as the visible label
                string hint = null;
                if (label.Length > 30)
                {
                    hint = label;
                    label = PrettifyKey(key);
                }

                if (Regex.IsMatch(spec, @"^[01]\s+or\s+[01]$"))
                {
                    fields.Add(new { section, key, label, hint, type = "bool", value = defaultValue, options = (object)null, min = 0.0, max = 0.0 });
                }
                else if (spec.Contains("\" is "))
                {
                    var options = Regex.Matches(spec, @"""([^""]+)""\s+is\s+(\S+)")
                        .Cast<Match>()
                        .Select(m => new { label = m.Groups[1].Value, value = m.Groups[2].Value })
                        .ToList();
                    if (options.Count > 0)
                    {
                        fields.Add(new { section, key, label, hint, type = "select", value = defaultValue, options = (object)options, min = 0.0, max = 0.0 });
                    }
                }
                else
                {
                    var range = Regex.Match(spec, @"from\s+(-?[\d.]+)\s+to\s+(-?[\d.]+)");
                    if (range.Success)
                    {
                        fields.Add(new { section, key, label, hint, type = "number", value = defaultValue, options = (object)null,
                            min = double.Parse(range.Groups[1].Value), max = double.Parse(range.Groups[2].Value) });
                    }
                    else
                    {
                        fields.Add(new { section, key, label, hint, type = "text", value = defaultValue, options = (object)null, min = 0.0, max = 0.0 });
                    }
                }
            }

            return fields;
        }

        /// <summary>
        /// "CM_WEATHER" -> "Cm Weather", "START_WETNESS" -> "Start Wetness"
        /// </summary>
        private static string PrettifyKey(string key)
        {
            var words = key.Split('_')
                .Where(w => !string.IsNullOrEmpty(w))
                .Select(w => char.ToUpper(w[0]) + w.Substring(1).ToLower());
            return string.Join(" ", words);
        }

        /// <summary>
        /// Track condition presets (from ACTools' Game.DefaultTrackPropertiesPresets):
        /// returns SESSION_START, RANDOMNESS, LAP_GAIN, SESSION_TRANSFER for race.ini [DYNAMIC_TRACK]
        /// </summary>
        public static (int SessionStart, int Randomness, int LapGain, int SessionTransfer) GetTrackStatePreset(int preset)
        {
            switch (preset)
            {
                case 0: return (86, 1, 30, 50);    // Dusty
                case 1: return (89, 3, 50, 80);    // Old
                case 2: return (96, 1, 300, 80);   // Slow
                case 3: return (95, 2, 132, 90);   // Green
                case 4: return (98, 2, 700, 80);   // Fast
                case 5: return (100, 0, 1, 100);   // Optimum
                default: return (95, 2, 132, 90);  // Auto (weather-defined approximation)
            }
        }

        /// <summary>
        /// Writes a weather controller's user settings to
        /// Documents/Assetto Corsa/cfg/extension/state/lua/wfx_controller/&lt;id&gt;__settings.ini
        /// (where CSP reads them at race start), grouped by ini section
        /// </summary>
        public static void PublishControllerSettings(string controllerId, Dictionary<string, Dictionary<string, string>> settings)
        {
            if (settings == null || settings.Count == 0)
            {
                return;
            }

            var dir = Path.Combine(
                System.Environment.GetFolderPath(System.Environment.SpecialFolder.MyDocuments),
                "Assetto Corsa", "cfg", "extension", "state", "lua", "wfx_controller");
            Directory.CreateDirectory(dir);

            var ini = new StringBuilder();
            foreach (var section in settings)
            {
                ini.AppendLine($"[{section.Key}]");
                foreach (var kv in section.Value)
                {
                    ini.AppendLine($"{kv.Key}={kv.Value}");
                }
                ini.AppendLine();
            }

            File.WriteAllText(Path.Combine(dir, $"{controllerId}__settings.ini"), ini.ToString());
        }

        /// <summary>
        /// Parses a layout folder's ui_track.json for name/priority (used by main-layout selection)
        /// </summary>
        public static UITrack GetLayoutData(string layoutFolder)
        {
            var jsonPath = Path.Combine(layoutFolder, "ui_track.json");
            if (!File.Exists(jsonPath))
            {
                return null;
            }

            try
            {
                var content = JsonHelper.RepairMalformedJson(File.ReadAllText(jsonPath));
                return JsonSerializer.Deserialize<UITrack>(JsonHelper.CleanRawJson(content), new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString,
                    AllowTrailingCommas = true,
                    ReadCommentHandling = JsonCommentHandling.Skip
                });
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Picks the main layout of a multi-layout track the way ACTools does: the layout whose
        /// ui_track.json name is closest to the track folder name, weighted by preferred /
        /// non-default layout name patterns and the optional "priority" field in ui_track.json
        /// </summary>
        public static string GetMainLayoutSubPath(string trackFolderName, List<string> layoutFolders)
        {
            if (layoutFolders == null || layoutFolders.Count == 0)
            {
                return null;
            }
            if (layoutFolders.Count == 1)
            {
                return Path.GetFileName(layoutFolders[0]);
            }

            var trackId = trackFolderName.ToLowerInvariant();
            string preferred = null;
            var preferredPriority = double.MinValue;

            foreach (var folder in layoutFolders)
            {
                var layoutId = Path.GetFileName(folder);
                if (string.IsNullOrEmpty(layoutId))
                {
                    continue;
                }
                layoutId = layoutId.ToLowerInvariant();

                var data = GetLayoutData(folder);
                var name = !string.IsNullOrEmpty(data?.Name) ? data.Name.ToLowerInvariant() : layoutId;
                var distance = LevenshteinDistance(trackId, name);
                double priority = Math.Clamp(100 - distance * 10, 0, 100) - name.Length;

                priority -= NonDefaultLayoutRegex.Matches(layoutId).Cast<Match>().Sum(GetLayoutMatchWeight) * 10;
                priority += PreferredLayoutRegex.Matches(layoutId).Cast<Match>().Sum(GetLayoutMatchWeight) * 10;
                priority -= NonDefaultLayoutRegex.Matches(name).Cast<Match>().Sum(GetLayoutMatchWeight) * 100;
                priority += PreferredLayoutRegex.Matches(name).Cast<Match>().Sum(GetLayoutMatchWeight) * 100;
                priority += (data?.Priority ?? 0) * 1e8;

                if (priority > preferredPriority)
                {
                    preferredPriority = priority;
                    preferred = layoutId;
                }
            }

            return preferred ?? Path.GetFileName(layoutFolders[0]);
        }

        /// <summary>
        /// Finds the common track name shared by all of a multi-layout track's layout
        /// names (ported from ACTools' FindNameForMultiLayoutMode): the longest common
        /// prefix, trimmed and with a trailing separator removed. Null when the layout
        /// names share no meaningful prefix.
        /// </summary>
        public static string GetCommonTrackName(IReadOnlyList<string> names)
        {
            var baseName = names?.FirstOrDefault();
            if (baseName == null)
            {
                return null;
            }

            var minLength = names.Where(n => n != null).Select(n => n.Length).Min();
            for (var i = minLength; i > 2; i--)
            {
                var result = baseName.Substring(0, i);
                if (names.Skip(1).Any(n => n?.Substring(0, i) != result))
                {
                    continue;
                }

                result = result.Trim();
                if (result.Length > 2 && (result.EndsWith("-") || result.EndsWith("—") || result.EndsWith("/") || result.EndsWith("(")))
                {
                    result = result.Substring(0, result.Length - 1).Trim();
                }
                return result;
            }

            return null;
        }

        private static int LevenshteinDistance(string a, string b)
        {
            if (string.IsNullOrEmpty(a)) return string.IsNullOrEmpty(b) ? 0 : b.Length;
            if (string.IsNullOrEmpty(b)) return a.Length;

            var previous = new int[b.Length + 1];
            var current = new int[b.Length + 1];
            for (var j = 0; j <= b.Length; j++) previous[j] = j;

            for (var i = 1; i <= a.Length; i++)
            {
                current[0] = i;
                for (var j = 1; j <= b.Length; j++)
                {
                    var cost = a[i - 1] == b[j - 1] ? 0 : 1;
                    current[j] = Math.Min(
                        Math.Min(current[j - 1] + 1, previous[j] + 1),
                        previous[j - 1] + cost);
                }
                (previous, current) = (current, previous);
            }

            return previous[b.Length];
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
                var repairedJson = JsonHelper.RepairMalformedJson(jsonContent);
                
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString,
                    AllowTrailingCommas = true,
                    ReadCommentHandling = JsonCommentHandling.Skip
                };
                
                jsonOptions.Converters.Add(new JsonHelper.FlexibleStringConverter());
                jsonOptions.Converters.Add(new JsonHelper.FlexibleIntConverter());

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

                // Get and validate country code
                string countryCode = null;
                if (!string.IsNullOrEmpty(trackData.Country))
                {
                    var code = CountriesHelper.GetCountryCode(trackData.Country);
                    if (!string.IsNullOrEmpty(code) && CountriesHelper.IsValidCountryCode(code))
                    {
                        countryCode = code.ToUpper();
                    }
                }

                var track = new Track
                {
                    GameId = gameId,
                    Name = !string.IsNullOrEmpty(trackData.Name) ? trackData.Name : Path.GetFileName(trackFolder),
                    Path = Path.GetFileName(trackFolder),
                    SubPath = subPath,
                    Country = countryCode,
                    City = !string.IsNullOrEmpty(trackData.City) ? trackData.City : null,
                    Author = !string.IsNullOrEmpty(trackData.Author) ? trackData.Author : null,
                    Version = "0",
                    Details = !string.IsNullOrEmpty(trackData.Description) ? trackData.Description : null,
                    Year = trackData.Year.HasValue && trackData.Year.Value > 0 ? trackData.Year : null,
                    IsNew = true,
                    Status = 1
                };

                // Parse length from string and convert to meters
                // Examples: "6049 m" -> 6049, "2.5 mi" -> 4023.36, "3.8 km" -> 3800
                if (!string.IsNullOrEmpty(trackData.Length))
                {
                    var lengthMatch = System.Text.RegularExpressions.Regex.Match(trackData.Length, @"([0-9]+\.?[0-9]*)");
                    if (lengthMatch.Success && double.TryParse(lengthMatch.Groups[1].Value, out var length))
                    {
                        // Check if the unit is kilometers and convert to meters
                        if (trackData.Length.Contains("km", StringComparison.OrdinalIgnoreCase))
                        {
                            // Convert kilometers to meters (1 km = 1000 m)
                            track.Length = length * 1000;
                        }
                        // Check if the unit is miles and convert to meters
                        else if (trackData.Length.Contains("mi", StringComparison.OrdinalIgnoreCase) || 
                            (trackData.Length.Contains("m", StringComparison.OrdinalIgnoreCase) && length < 1000))
                        {
                            // Convert miles to meters (1 mile = 1609.34 m)
                            track.Length = length * 1609.34;
                        }
                        else
                        {
                            // Assume meters if no unit or just "m"
                            track.Length = length;
                        }
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

    }
}
