using System;
using System.Collections.Generic;

namespace RacerUI.Entities
{
    public class CarModel
    {
        public int Id { get; set; }
        public int? MakeId { get; set; }
        public string Name { get; set; }
        
        // Navigation properties
        public List<Car> Cars { get; set; } = new List<Car>();
    }
}
