using Dapper;
using RacerUI.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RacerUI.SQL
{
    public static class RacingSpecializationsRepository
    {
        /// <summary>
        /// Gets all racing specializations
        /// </summary>
        /// <returns>A list of racing specializations</returns>
        public static IEnumerable<RacingSpecialization> GetAll()
        {
            const string sql = "SELECT * FROM RacingSpecializations ORDER BY Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<RacingSpecialization>(sql);
            }
        }

        /// <summary>
        /// Gets a racing specialization by its ID
        /// </summary>
        /// <param name="id">The ID of the racing specialization to retrieve</param>
        /// <returns>The racing specialization entity if found, null otherwise</returns>
        public static RacingSpecialization GetById(int id)
        {
            const string sql = "SELECT * FROM RacingSpecializations WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<RacingSpecialization>(sql, new { Id = id });
            }
        }

        /// <summary>
        /// Gets a racing specialization by its name
        /// </summary>
        /// <param name="name">The name of the racing specialization to retrieve</param>
        /// <returns>The racing specialization entity if found, null otherwise</returns>
        public static RacingSpecialization GetByName(string name)
        {
            const string sql = "SELECT * FROM RacingSpecializations WHERE Name = @Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<RacingSpecialization>(sql, new { Name = name });
            }
        }

        /// <summary>
        /// Adds a new racing specialization
        /// </summary>
        /// <param name="specialization">The racing specialization entity to add</param>
        /// <returns>The ID of the newly added racing specialization</returns>
        public static int Add(RacingSpecialization specialization)
        {
            const string sql = @"
                INSERT INTO RacingSpecializations (Name, Label)
                VALUES (@Name, @Label);
                SELECT last_insert_rowid();";

            using (var connection = Connection.GetConnection())
            {
                return connection.ExecuteScalar<int>(sql, specialization);
            }
        }

        /// <summary>
        /// Updates an existing racing specialization
        /// </summary>
        /// <param name="specialization">The racing specialization entity with updated values</param>
        /// <returns>True if the update was successful</returns>
        public static bool Update(RacingSpecialization specialization)
        {
            const string sql = @"
                UPDATE RacingSpecializations SET 
                    Name = @Name,
                    Label = @Label
                WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, specialization) > 0;
            }
        }

        /// <summary>
        /// Deletes a racing specialization by its ID
        /// </summary>
        /// <param name="id">The ID of the racing specialization to delete</param>
        /// <returns>True if the deletion was successful</returns>
        public static bool Delete(int id)
        {
            const string sql = "DELETE FROM RacingSpecializations WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id }) > 0;
            }
        }

        /// <summary>
        /// Gets a racing specialization with its related cars
        /// </summary>
        /// <param name="id">The ID of the racing specialization to retrieve</param>
        /// <returns>The racing specialization entity with its related cars</returns>
        public static RacingSpecialization GetWithCars(int id)
        {
            const string sql = @"
                SELECT rs.*, c.*
                FROM RacingSpecializations rs
                LEFT JOIN Cars_Specializations cs ON rs.Id = cs.Specialization
                LEFT JOIN Cars c ON cs.CarId = c.Id
                WHERE rs.Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                var specializationDict = new Dictionary<int, RacingSpecialization>();

                var result = connection.Query<RacingSpecialization, Car, RacingSpecialization>(
                    sql,
                    (specialization, car) =>
                    {
                        if (!specializationDict.TryGetValue(specialization.Id, out var existingSpecialization))
                        {
                            existingSpecialization = specialization;
                            existingSpecialization.Cars = new List<Car>();
                            specializationDict.Add(existingSpecialization.Id, existingSpecialization);
                        }

                        if (car != null)
                        {
                            existingSpecialization.Cars.Add(car);
                        }

                        return existingSpecialization;
                    },
                    new { Id = id },
                    splitOn: "Id");

                return specializationDict.Values.FirstOrDefault();
            }
        }
    }
}
