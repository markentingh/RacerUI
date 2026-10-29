namespace RacerUI.Entities
{
    /// <summary>
    /// A saved racing configuration shown on the History page's Favorites
    /// section. ConfigJson holds the race settings snapshot (time of day,
    /// weather system, wind, track state); car/skin/track are linked via
    /// CarId/CarSkinId/TrackId, where TrackId is the effective track row
    /// (a layout row when a layout was selected).
    /// </summary>
    public class Favorite
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string ConfigJson { get; set; }
        public int? CarId { get; set; }
        public int? CarSkinId { get; set; }
        public int? TrackId { get; set; }
        public string Created { get; set; }
    }
}
