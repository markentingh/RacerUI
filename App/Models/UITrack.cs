using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace RacerUI.Models
{
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
}
