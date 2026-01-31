using System.Collections.Generic;

namespace RacerUI.Entities
{
    public class TrackType
    {
        public int Id { get; set; }
        public string Name { get; set; }
        
        // Navigation properties
        public List<Track> Tracks { get; set; } = new List<Track>();
    }
}
