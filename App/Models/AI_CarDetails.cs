using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace RacerUI.Models
{
    public class AI_CarDetails
    {
        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("make")]
        public string Make { get; set; }

        [JsonPropertyName("model")]
        public string Model { get; set; }

        [JsonPropertyName("extra")]
        public string Extra { get; set; }

        [JsonPropertyName("year")]
        public int Year { get; set; }

        [JsonPropertyName("class")]
        public string Class { get; set; }

        [JsonPropertyName("country")]
        public string Country { get; set; }

        [JsonPropertyName("types")]
        public List<string> Types { get; set; }

        [JsonPropertyName("styles")]
        public List<string> Styles { get; set; }

        [JsonPropertyName("specializations")]
        public List<string> Specializations { get; set; }

        [JsonPropertyName("shortDescription")]
        public string ShortDescription { get; set; }

        [JsonPropertyName("minBHP")]
        public decimal? MinBHP { get; set; }

        [JsonPropertyName("minTorque")]
        public decimal? MinTorque { get; set; }

        [JsonPropertyName("zeroTo100Kmph")]
        public decimal? ZeroTo100Kmph { get; set; }

        [JsonPropertyName("zeroTo60mph")]
        public decimal? ZeroTo60mph { get; set; }

        [JsonPropertyName("author")]
        public string Author { get; set; }

        [JsonPropertyName("details")]
        public string Details { get; set; }

        [JsonPropertyName("credits")]
        public string Credits { get; set; }

        [JsonPropertyName("engine")]
        public string Engine { get; set; }

        [JsonPropertyName("brakes")]
        public string Brakes { get; set; }

        [JsonPropertyName("tires")]
        public string Tires { get; set; }

        [JsonPropertyName("suspension")]
        public string Suspension { get; set; }

        [JsonPropertyName("seats")]
        public int Seats { get; set; }

        [JsonPropertyName("driverside")]
        public string DriverSide { get; set; }

        [JsonPropertyName("turbo")]
        public string Turbo { get; set; }

        [JsonPropertyName("nitrous")]
        public string Nitrous { get; set; }

        [JsonPropertyName("modkit")]
        public string ModKit { get; set; }

        [JsonPropertyName("team")]
        public string Team { get; set; }
    }

    public class AI_CarCredit
    {
        [JsonPropertyName("features")]
        public string Features { get; set; }

        [JsonPropertyName("by")]
        public string By { get; set; }
    }
}
