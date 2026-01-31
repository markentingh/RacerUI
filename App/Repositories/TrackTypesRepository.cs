using Dapper;
using RacerUI.Entities;

namespace RacerUI.SQL
{
    public static class TrackTypesRepository
    {
        /// <summary>
        /// Gets a track type by name
        /// </summary>
        public static TrackType GetByName(string name)
        {
            const string sql = "SELECT * FROM TrackTypes WHERE Name = @Name COLLATE NOCASE";

            using (var connection = Connection.GetConnection())
            {
                return connection.QueryFirstOrDefault<TrackType>(sql, new { Name = name });
            }
        }

        /// <summary>
        /// Gets all track types
        /// </summary>
        public static IEnumerable<TrackType> GetAll()
        {
            const string sql = "SELECT * FROM TrackTypes ORDER BY Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<TrackType>(sql);
            }
        }

        /// <summary>
        /// Adds a new track type
        /// </summary>
        public static int Add(TrackType trackType)
        {
            const string sql = @"
                INSERT INTO TrackTypes (Name) 
                VALUES (@Name);
                SELECT last_insert_rowid();";

            using (var connection = Connection.GetConnection())
            {
                return connection.ExecuteScalar<int>(sql, trackType);
            }
        }

        /// <summary>
        /// Gets or creates a track type by name
        /// </summary>
        public static TrackType GetOrCreate(string name)
        {
            var trackType = GetByName(name);
            if (trackType == null)
            {
                trackType = new TrackType { Name = name };
                trackType.Id = Add(trackType);
            }
            return trackType;
        }
    }
}
