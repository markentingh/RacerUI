using System.Text.Json.Serialization;


namespace RacerUI.Models
{
    public class UISkin
    {
        [JsonPropertyName("skinname")]
        public string Name { get; set; }
        
        [JsonPropertyName("drivername")]
        public string DriverName { get; set; }
        
        [JsonPropertyName("country")]
        public string Country { get; set; }
        
        [JsonPropertyName("team")]
        public string Team { get; set; }
        
        [JsonPropertyName("number")]
        public string Number { get; set; }
    }
}
