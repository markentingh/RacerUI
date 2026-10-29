namespace RacerUI.Entities
{
    /// <summary>
    /// A favorite joined with the car/skin/track display data needed by the
    /// History page list. ConfigJson holds only the race settings snapshot;
    /// TrackId is the effective track (a layout row when one was selected),
    /// with ParentTrackName populated when that row is a layout.
    /// </summary>
    public class FavoriteDetails
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string ConfigJson { get; set; }
        public string Created { get; set; }

        public int? CarId { get; set; }
        public string CarName { get; set; }
        public string CarPath { get; set; }

        public int? CarSkinId { get; set; }
        public string SkinPath { get; set; }

        public int? TrackId { get; set; }
        public string TrackName { get; set; }
        public string TrackPath { get; set; }
        public string TrackSubPath { get; set; }
        public int? TrackParentId { get; set; }
        public string ParentTrackName { get; set; }
    }
}
