using System;

namespace RacerUI.Entities
{
    public class CarTagMapping
    {
        public int CarId { get; set; }
        public int TagId { get; set; }
        
        // Navigation properties
        public Car Car { get; set; }
        public CarTag Tag { get; set; }
    }
}
