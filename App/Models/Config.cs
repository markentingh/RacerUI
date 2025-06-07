using System.Text.Json.Serialization;

namespace RacerUI.Models
{
    public class Config
    {
        public ConfigAdmin Admin { get; set; }
    }

    public class ConfigAdmin
    {
        public string Username { get; set; }
        public string Pass { get; set; }
    }
}
