using Dapper;
using RacerUI.Entities;

namespace RacerUI.SQL
{
    public static class FavoritesRepository
    {
        private static bool _tableChecked = false;

        /// <summary>
        /// Creates the Favorites table when it doesn't exist yet (see SQL/favorites.sql)
        /// </summary>
        private static void EnsureTable()
        {
            if (_tableChecked) return;

            const string sql = @"
                CREATE TABLE IF NOT EXISTS Favorites (
                    Id         INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE NOT NULL,
                    Title      TEXT NOT NULL,
                    ConfigJson TEXT NOT NULL,
                    CarId      INTEGER REFERENCES Cars (Id),
                    CarSkinId  INTEGER REFERENCES Cars_Skins (Id),
                    TrackId    INTEGER REFERENCES Tracks (Id),
                    Created    TEXT
                );";

            using (var connection = Connection.GetConnection())
            {
                connection.Execute(sql);
            }
            _tableChecked = true;
        }

        /// <summary>
        /// Gets a page of saved favorites with joined car/skin/track display
        /// data, newest first. When the saved track is a layout (ParentId set),
        /// the parent track's name is included so the UI can show
        /// "track (layout)".
        /// </summary>
        public static IEnumerable<FavoriteDetails> GetAll(int start, int length)
        {
            EnsureTable();
            const string sql = @"
                SELECT f.Id, f.Title, f.ConfigJson, f.Created,
                       f.CarId, c.Name AS CarName, c.Path AS CarPath,
                       f.CarSkinId, s.Path AS SkinPath,
                       f.TrackId, t.Name AS TrackName, t.Path AS TrackPath,
                       t.SubPath AS TrackSubPath, t.ParentId AS TrackParentId,
                       p.Name AS ParentTrackName
                FROM Favorites f
                LEFT JOIN Cars c ON c.Id = f.CarId
                LEFT JOIN Cars_Skins s ON s.Id = f.CarSkinId
                LEFT JOIN Tracks t ON t.Id = f.TrackId
                LEFT JOIN Tracks p ON p.Id = t.ParentId
                ORDER BY f.Id DESC
                LIMIT @Length OFFSET @Start";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<FavoriteDetails>(sql, new { Start = start, Length = length });
            }
        }

        /// <summary>
        /// Gets the total number of saved favorites
        /// </summary>
        public static int GetCount()
        {
            EnsureTable();
            const string sql = "SELECT COUNT(*) FROM Favorites";

            using (var connection = Connection.GetConnection())
            {
                return connection.ExecuteScalar<int>(sql);
            }
        }

        /// <summary>
        /// Saves a new favorite and returns its id
        /// </summary>
        public static int Add(Favorite favorite)
        {
            EnsureTable();
            const string sql = @"
                INSERT INTO Favorites (Title, ConfigJson, CarId, CarSkinId, TrackId, Created)
                VALUES (@Title, @ConfigJson, @CarId, @CarSkinId, @TrackId, @Created);
                SELECT last_insert_rowid();";

            using (var connection = Connection.GetConnection())
            {
                return connection.ExecuteScalar<int>(sql, favorite);
            }
        }

        /// <summary>
        /// Resolves a Cars_Skins id from a car id + skin folder path/name
        /// </summary>
        public static int? GetSkinId(int carId, string skin)
        {
            if (string.IsNullOrEmpty(skin)) return null;

            const string sql = @"
                SELECT Id FROM Cars_Skins
                WHERE CarId = @CarId AND (Path = @Skin OR Name = @Skin)
                LIMIT 1";

            using (var connection = Connection.GetConnection())
            {
                return connection.QueryFirstOrDefault<int?>(sql, new { CarId = carId, Skin = skin });
            }
        }

        /// <summary>
        /// Deletes a favorite by id
        /// </summary>
        public static bool Delete(int id)
        {
            EnsureTable();
            const string sql = "DELETE FROM Favorites WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id }) > 0;
            }
        }
    }
}
