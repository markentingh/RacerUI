using System;

namespace RacerUI.Entities
{
    public class CarDriver
    {
        public int CarId { get; set; }
        public int DriverId { get; set; }
        public int SkinId { get; set; }
        
        // Navigation properties
        public Car Car { get; set; }
        public Driver Driver { get; set; }
        public CarSkin Skin { get; set; }
    }
}
