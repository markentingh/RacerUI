using System;

namespace RacerUI.Entities
{
    public class CarStylingMapping
    {
        public int CarId { get; set; }
        public int StylingId { get; set; }
        
        // Navigation properties
        public Car Car { get; set; }
        public CarStyling Styling { get; set; }
    }
}
