using System;
using System.Collections.Generic;

namespace RacerUI.Entities
{
    public class CarTag
    {
        public int Id { get; set; }
        public int CarId { get; set; }
        public int TagId { get; set; }
        public string Tag { get; set; }
        
        // Navigation properties
        public List<Car> Cars { get; set; } = new List<Car>();
    }
}
