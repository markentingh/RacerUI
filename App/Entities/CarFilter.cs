using System.Collections.Generic;

namespace RacerUI.Entities
{
    public class CarFilter
    {
        /// <summary>
        /// ISO 3166-1 alpha-2 country codes
        /// </summary>
        public List<string> Countries { get; set; } = new List<string>();

        /// <summary>
        /// Car make IDs
        /// </summary>
        public List<int> Makes { get; set; } = new List<int>();

        /// <summary>
        /// Car model IDs
        /// </summary>
        public List<int> Models { get; set; } = new List<int>();

        /// <summary>
        /// 4-digit years
        /// </summary>
        public List<int> Years { get; set; } = new List<int>();

        /// <summary>
        /// Car type IDs
        /// </summary>
        public List<int> Types { get; set; } = new List<int>();

        /// <summary>
        /// Car style IDs
        /// </summary>
        public List<int> Styles { get; set; } = new List<int>();

        /// <summary>
        /// Car specialization IDs
        /// </summary>
        public List<int> Specializations { get; set; } = new List<int>();

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
