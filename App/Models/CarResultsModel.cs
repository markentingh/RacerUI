using RacerUI.Entities;

namespace RacerUI.Models
{
    public class CarResultsModel
    {
        public List<Car> Cars { get; set; } = new List<Car>();
        public List<CarMake> Makes { get; set; } = new List<CarMake>();
        public List<CarType> Types { get; set; } = new List<CarType>();
        public List<CarStyling> Stylings { get; set; } = new List<CarStyling>();
        public List<RacingSpecialization> Specializations { get; set; } = new List<RacingSpecialization>();
    }
}
