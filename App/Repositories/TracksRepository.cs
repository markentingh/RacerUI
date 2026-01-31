using Dapper;
using RacerUI.Entities;
using RacerUI.Models;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace RacerUI.SQL
{
    public static class TracksRepository
    {
        /// <summary>
        /// Adds a new track to the database
        /// </summary>
        public static int Add(Track track)
        {
            const string sql = @"
                INSERT INTO Tracks (
                    GameId, TypeId, ParentId, Name, Path, SubPath, Country, City, Distance, Length, Width, PitBoxes, Run, Year, Latitude, Longitude, IsNew, Status, Rating, Author, Version, Notes, Details
                ) VALUES (
                    @GameId, @TypeId, @ParentId, @Name, @Path, @SubPath, @Country, @City, @Distance, @Length, @Width, @PitBoxes, @Run, @Year, @Latitude, @Longitude, @IsNew, @Status, @Rating, @Author, @Version, @Notes, @Details
                );
                SELECT last_insert_rowid();";

            using (var connection = Connection.GetConnection())
            {
                return connection.ExecuteScalar<int>(sql, track);
            }
        }

        /// <summary>
        /// Updates an existing track
        /// </summary>
        public static void Update(Track track)
        {
            const string sql = @"
                UPDATE Tracks SET
                    GameId = @GameId,
                    TypeId = @TypeId,
                    ParentId = @ParentId,
                    Name = @Name,
                    Path = @Path,
                    SubPath = @SubPath,
                    Country = @Country,
                    City = @City,
                    Distance = @Distance,
                    Length = @Length,
                    Width = @Width,
                    PitBoxes = @PitBoxes,
                    Run = @Run,
                    Year = @Year,
                    Latitude = @Latitude,
                    Longitude = @Longitude,
                    IsNew = @IsNew,
                    Status = @Status,
                    Rating = @Rating,
                    Author = @Author,
                    Version = @Version,
                    Notes = @Notes,
                    Details = @Details
                WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                connection.Execute(sql, track);
            }
        }

        /// <summary>
        /// Gets a track by ID
        /// </summary>
        public static Track GetById(int id)
        {
            const string sql = @"
                SELECT t.*, tt.Name as TypeName
                FROM Tracks t
                LEFT JOIN TrackTypes tt ON t.TypeId = tt.Id
                WHERE t.Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.QueryFirstOrDefault<Track>(sql, new { Id = id });
            }
        }

        /// <summary>
        /// Gets all tracks
        /// </summary>
        public static IEnumerable<Track> GetAll()
        {
            const string sql = @"
                SELECT t.*, tt.Name as TypeName
                FROM Tracks t
                LEFT JOIN TrackTypes tt ON t.TypeId = tt.Id
                ORDER BY t.Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<Track>(sql);
            }
        }

        /// <summary>
        /// Deletes a track by ID
        /// </summary>
        public static void Delete(int id)
        {
            const string sql = "DELETE FROM Tracks WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                connection.Execute(sql, new { Id = id });
            }
        }

        /// <summary>
        /// Gets all track types
        /// </summary>
        public static IEnumerable<TrackType> GetAllTypes()
        {
            const string sql = "SELECT * FROM TrackTypes ORDER BY Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<TrackType>(sql);
            }
        }

        /// <summary>
        /// Gets distinct countries from tracks
        /// </summary>
        public static IEnumerable<string> GetDistinctCountries()
        {
            const string sql = @"
                SELECT DISTINCT Country 
                FROM Tracks 
                WHERE Country IS NOT NULL AND Country != ''
                ORDER BY Country";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<string>(sql);
            }
        }

        /// <summary>
        /// Filters tracks with pagination and returns count
        /// </summary>
        public static int FilterCount(TrackFilterModel filterModel)
        {
            var sql = new StringBuilder();
            sql.Append("SELECT COUNT(DISTINCT t.Id) FROM Tracks t ");

            var whereClauses = new List<string>();
            var parameters = new DynamicParameters();

            // Country filter
            if (filterModel.Countries != null && filterModel.Countries.Count > 0)
            {
                whereClauses.Add("t.Country IN @Countries");
                parameters.Add("Countries", filterModel.Countries);
            }

            // Type filter
            if (filterModel.Types != null && filterModel.Types.Count > 0)
            {
                sql.Append("INNER JOIN TrackTypes tt ON t.TypeId = tt.Id ");
                whereClauses.Add("t.TypeId IN @Types");
                parameters.Add("Types", filterModel.Types);
            }

            // Search filter
            if (!string.IsNullOrEmpty(filterModel.Search))
            {
                whereClauses.Add("(t.Name LIKE @Search OR t.Author LIKE @Search)");
                parameters.Add("Search", $"%{filterModel.Search}%");
            }

            // Exclude invalid tracks
            whereClauses.Add("t.Name IS NOT NULL");
            whereClauses.Add("t.Name != ''");
            
            // Exclude child tracks (only show parent tracks)
            whereClauses.Add("t.ParentId IS NULL");

            if (whereClauses.Count > 0)
            {
                sql.Append("WHERE " + string.Join(" AND ", whereClauses));
            }

            using (var connection = Connection.GetConnection())
            {
                return connection.ExecuteScalar<int>(sql.ToString(), parameters);
            }
        }

        /// <summary>
        /// Filters tracks with pagination
        /// </summary>
        public static IEnumerable<Track> Filter(TrackFilterModel filterModel)
        {
            var sql = new StringBuilder();
            sql.Append(@"
                SELECT DISTINCT t.*, tt.Name as TypeName
                FROM Tracks t 
                LEFT JOIN TrackTypes tt ON t.TypeId = tt.Id ");

            var whereClauses = new List<string>();
            var parameters = new DynamicParameters();

            // Country filter
            if (filterModel.Countries != null && filterModel.Countries.Count > 0)
            {
                whereClauses.Add("t.Country IN @Countries");
                parameters.Add("Countries", filterModel.Countries);
            }

            // Type filter
            if (filterModel.Types != null && filterModel.Types.Count > 0)
            {
                whereClauses.Add("t.TypeId IN @Types");
                parameters.Add("Types", filterModel.Types);
            }

            // Search filter
            if (!string.IsNullOrEmpty(filterModel.Search))
            {
                whereClauses.Add("(t.Name LIKE @Search OR t.Author LIKE @Search)");
                parameters.Add("Search", $"%{filterModel.Search}%");
            }

            // Exclude invalid tracks
            whereClauses.Add("t.Name IS NOT NULL");
            whereClauses.Add("t.Name != ''");
            
            // Exclude child tracks (only show parent tracks)
            whereClauses.Add("t.ParentId IS NULL");

            if (whereClauses.Count > 0)
            {
                sql.Append("WHERE " + string.Join(" AND ", whereClauses) + " ");
            }

            sql.Append("ORDER BY t.Name ");

            // Pagination
            if (filterModel.Start.HasValue && filterModel.Length.HasValue)
            {
                sql.Append("LIMIT @Length OFFSET @Start");
                parameters.Add("Start", filterModel.Start.Value);
                parameters.Add("Length", filterModel.Length.Value);
            }

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<Track>(sql.ToString(), parameters);
            }
        }
    }
}
