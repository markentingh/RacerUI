namespace RacerUI.Entities
{
    public class Game
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Path { get; set; }
        public string Title { get; set; }
        
        // Navigation properties
        public List<Car> Cars { get; set; } = new List<Car>();
    }
}
