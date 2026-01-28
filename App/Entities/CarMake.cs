namespace RacerUI.Entities
{
    public class CarMake
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Logo { get; set; }
        public string CountryCode { get; set; }

        // Navigation properties
        public List<Car> Cars { get; set; } = new List<Car>();
    }
}
