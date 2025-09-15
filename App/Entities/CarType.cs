using System;
using System.Collections.Generic;

namespace RacerUI.Entities
{
    public class CarType
    {
        public int Id { get; set; }
        public int TypeId { get; set; }
        public int CarId { get; set; }
        public string Name { get; set; }
        
        // Navigation properties
        public List<Car> Cars { get; set; } = new List<Car>();
        public List<CarType> CarTypes { get; set; } = new List<CarType>();
    }
}
