using Dapper;
using RacerUI.Entities;

namespace RacerUI.SQL
{
    public static class CarStylingRepository
    {
        /// <summary>
        /// Gets all car styling options
        /// </summary>
        /// <returns>A list of car styling options</returns>
        public static IEnumerable<CarStyling> GetAll()
        {
            const string sql = "SELECT * FROM CarStyling ORDER BY Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<CarStyling>(sql);
            }
        }

        /// <summary>
        /// Gets a car styling option by its ID
        /// </summary>
        /// <param name="id">The ID of the car styling option to retrieve</param>
        /// <returns>The car styling entity if found, null otherwise</returns>
        public static CarStyling GetById(int id)
        {
            const string sql = "SELECT * FROM CarStyling WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<CarStyling>(sql, new { Id = id });
            }
        }

        /// <summary>
        /// Gets a car styling option by its name
        /// </summary>
        /// <param name="name">The name of the car styling option to retrieve</param>
        /// <returns>The car styling entity if found, null otherwise</returns>
        public static CarStyling GetByName(string name)
        {
            const string sql = "SELECT * FROM CarStyling WHERE Name = @Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<CarStyling>(sql, new { Name = name });
            }
        }

        /// <summary>
        /// Adds a new car styling option
        /// </summary>
        /// <param name="carStyling">The car styling entity to add</param>
        /// <returns>The ID of the newly added car styling option</returns>
        public static int Add(CarStyling carStyling)
        {
            const string sql = @"
                INSERT INTO CarStyling (Name)
                VALUES (@Name);
                SELECT last_insert_rowid();";

            using (var connection = Connection.GetConnection())
            {
                return connection.ExecuteScalar<int>(sql, carStyling);
            }
        }

        /// <summary>
        /// Updates an existing car styling option
        /// </summary>
        /// <param name="carStyling">The car styling entity with updated values</param>
        /// <returns>True if the update was successful</returns>
        public static bool Update(CarStyling carStyling)
        {
            const string sql = @"
                UPDATE CarStyling SET 
                    Name = @Name
                WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, carStyling) > 0;
            }
        }

        /// <summary>
        /// Deletes a car styling option by its ID
        /// </summary>
        /// <param name="id">The ID of the car styling option to delete</param>
        /// <returns>True if the deletion was successful</returns>
        public static bool Delete(int id)
        {
            const string sql = "DELETE FROM CarStyling WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id }) > 0;
            }
        }
    }
}
