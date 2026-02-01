namespace RacerUI.Entities
{
    public class Track
    {
        public int Id { get; set; }
        public int GameId { get; set; }
        public int? TypeId { get; set; }
        public int? ParentId { get; set; }
        public string Name { get; set; }
        public string Path { get; set; }
        public string SubPath { get; set; }
        public string Country { get; set; }
        public string CountryName { get; set; }
        public string City { get; set; }
        public decimal? Distance { get; set; }
        public double? Length { get; set; }
        public int? Width { get; set; }
        public int? PitBoxes { get; set; }
        public string Run { get; set; }
        public int? Year { get; set; }
        public string Latitude { get; set; }
        public string Longitude { get; set; }
        public bool IsNew { get; set; } = true;
        public int Status { get; set; } = 1;
        public int? Rating { get; set; }
        public string Author { get; set; }
        public string Version { get; set; } = "0";
        public string Notes { get; set; }
        public string Details { get; set; }
        
        // Navigation properties
        public string TypeName { get; set; }
    }
}
