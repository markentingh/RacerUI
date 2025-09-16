using Dapper;
using RacerUI.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RacerUI.SQL
{
    public static class CarSkinsRepository
    {
        /// <summary>
        /// Gets all car skins
        /// </summary>
        /// <returns>A list of car skins</returns>
        public static IEnumerable<CarSkin> GetAll()
        {
            const string sql = "SELECT * FROM Cars_Skins";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<CarSkin>(sql);
            }
        }

        /// <summary>
        /// Gets a car skin by its ID
        /// </summary>
        /// <param name="id">The ID of the car skin to retrieve</param>
        /// <returns>The car skin entity if found, null otherwise</returns>
        public static CarSkin GetById(int id)
        {
            const string sql = "SELECT * FROM Cars_Skins WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<CarSkin>(sql, new { Id = id });
            }
        }

        /// <summary>
        /// Gets all car skins for a specific car
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <returns>A list of car skins for the specified car</returns>
        public static IEnumerable<CarSkin> GetByCarId(int carId)
        {
            const string sql = "SELECT * FROM Cars_Skins WHERE CarId = @CarId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<CarSkin>(sql, new { CarId = carId });
            }
        }

        /// <summary>
        /// Adds a new car skin
        /// </summary>
        /// <param name="carSkin">The car skin entity to add</param>
        /// <returns>The ID of the newly added car skin</returns>
        public static int Add(CarSkin carSkin)
        {
            const string sql = @"
                INSERT INTO Cars_Skins (Name, Path, Number, CarId)
                VALUES (@Name, @Path, @Number, @CarId);
                SELECT last_insert_rowid();";

            using (var connection = Connection.GetConnection())
            {
                return connection.ExecuteScalar<int>(sql, carSkin);
            }
        }

        /// <summary>
        /// Updates an existing car skin
        /// </summary>
        /// <param name="carSkin">The car skin entity with updated values</param>
        /// <returns>True if the update was successful</returns>
        public static bool Update(CarSkin carSkin)
        {
            const string sql = @"
                UPDATE Cars_Skins SET 
                    Name = @Name,
                    Path = @Path,
                    Number = @Number,
                    CarId = @CarId
                WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, carSkin) > 0;
            }
        }

        /// <summary>
        /// Deletes a car skin by its ID
        /// </summary>
        /// <param name="id">The ID of the car skin to delete</param>
        /// <returns>True if the deletion was successful</returns>
        public static bool Delete(int id)
        {
            const string sql = "DELETE FROM Cars_Skins WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id }) > 0;
            }
        }
    }
}
