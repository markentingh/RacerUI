using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace RacerUI.Models
{
    public class UICar
    {
        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("brand")]
        public string Brand { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; }

        [JsonPropertyName("tags")]
        public List<string> Tags { get; set; }

        [JsonPropertyName("class")]
        public string Class { get; set; }

        [JsonPropertyName("specs")]
        public UICarSpecs Specs { get; set; } = new UICarSpecs();

        [JsonPropertyName("year")]
        public string Year { get; set; }

        [JsonPropertyName("country")]
        public string Country { get; set; }

        [JsonPropertyName("author")]
        public string Author { get; set; }

        [JsonPropertyName("url")]
        public string Url { get; set; }

        [JsonPropertyName("version")]
        public string Version { get; set; }
    }

    public class UICarSpecs
    {
        [JsonPropertyName("bhp")]
        public string Bhp { get; set; }

        [JsonPropertyName("torque")]
        public string Torque { get; set; }

        [JsonPropertyName("weight")]
        public string Weight { get; set; }

        [JsonPropertyName("topspeed")]
        public string TopSpeed { get; set; }

        [JsonPropertyName("acceleration")]
        public string Acceleration { get; set; }

        [JsonPropertyName("pwratio")]
        public string PwRatio { get; set; }

        public bool HasTurbo { get; set; } = false;
        public string SuspensionType { get; set; }
        public string Tires { get; set; }
    }
}
