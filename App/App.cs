using RacerUI.Entities;
using RacerUI.Models;
using System.Text.Json;

namespace RacerUI
{
    public enum Environment
    {
        development = 0,
        staging = 1,
        production = 2
    }

    public static class App
    {
        public static string Version = "0.1";
        public static Config Config { get; set; } = new Config();
        public static string ConfigFilename { get; set; } = "";
        public static List<string> Addresses { get; set; } = new List<string>();
        public static Environment Environment { get; set; } = Environment.development;
        public static bool IsDocker { get; set; }
        public static List<GameInfo> Games { get; set; } = new List<GameInfo>()
        {
            new GameInfo("assetto corsa", "Assetto Corsa", "", "assettocorsa")
        };
        public static List<CarType> CarTypes { get; set; }
        public static List<CarStyling> CarStylings { get; set; }
        public static List<RacingSpecialization> CarSpecializations { get; set; }
        public static List<TrackType> TrackTypes { get; set; }
        public static Dictionary<string, string> AvailableCountries { get; set; } = new Dictionary<string, string>();
        public static List<int> AvailableYears { get; set; } = new List<int>();

        private static string _rootPath { get; set; } = "";

        public static string RootPath
        {
            get
            {
                if (string.IsNullOrEmpty(_rootPath))
                {
                    _rootPath = Path.GetFullPath(".").Replace("\\", "/");
                }
                return _rootPath;
            }
        }

        public static string MapPath(string path = "")
        {
            path = path.Replace("\\", "/");
            if (path.Substring(0, 1) == "/") { path = path.Substring(1); } //remove slash at beginning of string
            if (IsDocker)
            {
                return Path.Combine(RootPath, path).Replace("\\", "/");
            }
            else
            {
                return Path.Combine(RootPath.Replace("/", "\\"), path.Replace("/", "\\"));
            }
        }

        public static void SaveConfig()
        {
            File.WriteAllText(MapPath("/" + ConfigFilename), JsonSerializer.Serialize(Config));
        }

        public static GameInfo Game(string name)
        {
            return Games.Find(x => x.Name == name);
        }
    }
}
