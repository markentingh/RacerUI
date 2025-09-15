using System;
using System.Collections.Generic;

namespace RacerUI.Entities
{
    public class CarSkin
    {
        public int Id { get; set; }
        public int CarId { get; set; }
        public string Name { get; set; }
        public string Path { get; set; }
        public string Number { get; set; }
        public int? DriverId { get; set; }
        
        // Navigation properties
        public Driver Driver { get; set; }
        public Car Car { get; set; }
    }
}
