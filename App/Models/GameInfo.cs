namespace RacerUI.Models
{
    public class GameInfo
    {
        public string Name { get; set; }
        public string Title { get; set; }
        public string AppId { get; set; }
        public string SteamAppFolder { get; set; }

        public GameInfo(string name, string title, string appId, string steamAppFolder) { 
            Name = name; 
            Title = title; 
            AppId = appId; 
            SteamAppFolder = steamAppFolder; 
        }
    }
}
