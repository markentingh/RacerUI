using System;
using System.Collections.Generic;

namespace RacerUI.Entities
{
    public class Driver
    {
        public int Id { get; set; }
        public string Name { get; set; }
        
        // Navigation properties
        public List<CarSkin> CarSkins { get; set; } = new List<CarSkin>();
    }
}
