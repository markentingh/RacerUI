using System;
using System.Collections.Generic;

namespace RacerUI.Entities
{
    public class RacingSpecialization
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Label { get; set; }
        
        // Navigation properties
        public List<Car> Cars { get; set; } = new List<Car>();
        public List<CarSpecialization> CarSpecializations { get; set; } = new List<CarSpecialization>();
    }
}
