using System.Text.RegularExpressions;
using Microsoft.Win32;

namespace RacerUI.Utils {
    public static class SteamHelper {
        public static string GetSteamDirectory() {
            var regKey = Registry.CurrentUser.OpenSubKey(@"Software\Valve\Steam");
            var steamPath = regKey?.GetValue("SteamPath")?.ToString();
            regKey?.Close();
            
            // Ensure path has correct OS-specific path separators
            if (steamPath != null) {
                // Convert to OS-specific path separators
                steamPath = Path.GetFullPath(steamPath);
            }
            
            return steamPath;
        }

        public static List<string> GetAllSteamLibraryPaths(string steamPath)
        {
            List<string> libraryPaths = new List<string>();
            if (string.IsNullOrEmpty(steamPath))
            {
                return libraryPaths;
            }

            string libraryFoldersFile = Path.Combine(steamPath, "steamapps", "libraryfolders.vdf");

            if (File.Exists(libraryFoldersFile))
            {
                string content = File.ReadAllText(libraryFoldersFile);
                // Regex to find BaseInstallFolder_X values
                MatchCollection matches = Regex.Matches(content, "\"path\"\\s+\"([^\"]+)\"");

                foreach (Match match in matches)
                {
                    if (match.Groups.Count > 1)
                    {
                        string path = match.Groups[1].Value;
                        libraryPaths.Add(path);
                    }
                }
            }
            return libraryPaths;
        }

        public static string GetGameInstallLocation(string game)
        {
            var steamInstallPath = GetSteamDirectory();
            var paths = GetAllSteamLibraryPaths(steamInstallPath);
            var gameInfo = App.Game(game);
            if(paths.Count > 0)
            {
                foreach(var path in paths)
                {
                    var gamePath = Path.Combine(path, "steamapps", "common", gameInfo.GamePath);
                    if(Directory.Exists(gamePath))
                    {
                        return gamePath;
                    }
                }
            }
            return "";
        }

        //private static void TryToRunSteam(string steamDirectory, bool launchAc) {
        //    try {
        //        Process.Start(Path.Combine(steamDirectory, "Steam.exe"), launchAc ?
        //                $"-silent -applaunch {CommonAcConsts.AppId.ToInvariantString()}" : "-silent");
        //        Thread.Sleep(2000);
        //    } catch (Exception e) {
        //        Log.Write(e);
        //    }
        //}

        //public static void EnsureSteamIsRunning(bool tryToRun, bool launchAc) {
        //    if (Process.GetProcessesByName("steam").Length > 0) return;
        //
        //    var steamDirectory = GetSteamDirectory();
        //    if (steamDirectory == null) return;
        //
        //    if (tryToRun) {
        //        TryToRunSteam(steamDirectory, launchAc);
        //        if (Process.GetProcessesByName("steam").Length == 0) {
        //            throw new Exception("Couldn’t run Steam");
        //        }
        //    }
        //}
    }
}