using System;

namespace RacerUI.Entities
{
    public class CarSpecialization: RacingSpecialization
    {
        public int CarId { get; set; }
        public int SpecializationId { get; set; }

        // Navigation properties
        public Car Car { get; set; }
    }
}
