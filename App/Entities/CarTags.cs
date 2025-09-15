using System;
using System.Collections.Generic;

namespace RacerUI.Entities
{
    public class CarTags
    {
        public int Id { get; set; }
        public string Tag { get; set; }
        
        // Navigation properties
        public List<Car> Cars { get; set; } = new List<Car>();
    }
}
