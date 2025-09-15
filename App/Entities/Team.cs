using System;
using System.Collections.Generic;

namespace RacerUI.Entities
{
    public class Team
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Website { get; set; }
        public string Logo { get; set; }
        
        // Navigation properties
        public List<Car> Cars { get; set; } = new List<Car>();
    }
}
