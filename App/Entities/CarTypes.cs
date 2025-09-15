using System;
using System.Collections.Generic;

namespace RacerUI.Entities
{
    public class CarTypes
    {
        public int Id { get; set; }
        public string Name { get; set; }
        
        // Navigation properties
        public List<Car> Cars { get; set; } = new List<Car>();
        public List<CarTypes> CarsTypes { get; set; } = new List<CarTypes>();
    }
}
