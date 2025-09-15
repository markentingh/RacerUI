using System;

namespace RacerUI.Entities
{
    public class CarTypeMapping
    {
        public int CarId { get; set; }
        public int TypeId { get; set; }
        
        // Navigation properties
        public Car Car { get; set; }
        public CarType Type { get; set; }
    }
}
