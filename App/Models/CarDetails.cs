using System.Collections.Generic;

namespace RacerUI.Models
{
    public class CarDetails
    {
        public string Path { get; set; }
        public Dictionary<string, Dictionary<string, string>> IniFiles { get; set; }
        public List<string> OtherFiles { get; set; }

        public CarDetails()
        {
            IniFiles = new Dictionary<string, Dictionary<string, string>>();
            OtherFiles = new List<string>();
        }
    }
}
