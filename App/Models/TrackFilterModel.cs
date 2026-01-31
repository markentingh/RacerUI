using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace RacerUI.Models
{
    public class TrackFilterModel
    {
        [JsonPropertyName("countries")]
        public List<string> Countries { get; set; } = new List<string>();
        
        [JsonPropertyName("types")]
        public List<int> Types { get; set; } = new List<int>();
        
        [JsonPropertyName("search")]
        public string Search { get; set; }
        
        [JsonPropertyName("start")]
        public int? Start { get; set; }
        
        [JsonPropertyName("length")]
        public int? Length { get; set; }
    }
}
