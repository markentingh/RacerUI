using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace RacerUI.Models
{
    public class CarFilterModel
    {
        /// <summary>
        /// ISO 3166-1 alpha-2 country codes
        /// </summary>
        public List<string> Countries { get; set; }

        /// <summary>
        /// Car make IDs
        /// </summary>
        public List<int> Makes { get; set; }

        /// <summary>
        /// Car model IDs
        /// </summary>
        public List<int> Models { get; set; }

        /// <summary>
        /// 4-digit years
        /// </summary>
        public List<int> Years { get; set; }

        /// <summary>
        /// Car class names (e.g., "GT3", "GT4", "LMP1")
        /// </summary>
        public List<string> Classes { get; set; }

        /// <summary>
        /// Car type IDs
        /// </summary>
        public List<int> Types { get; set; }

        /// <summary>
        /// Car style IDs
        /// </summary>
        public List<int> Styles { get; set; }

        /// <summary>
        /// Car specialization IDs
        /// </summary>
        public List<int> Specializations { get; set; }

        /// <summary>
        /// Text search query
        /// </summary>
        public string Search { get; set; }

        /// <summary>
        /// Starting index for pagination (0-based)
        /// </summary>
        public int? Start { get; set; }

        /// <summary>
        /// Number of records to return
        /// </summary>
        public int? Length { get; set; }
    }
}
