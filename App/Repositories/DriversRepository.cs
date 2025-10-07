using Dapper;
using RacerUI.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RacerUI.SQL
{
    public static class DriversRepository
    {
        /// <summary>
        /// Gets all drivers
        /// </summary>
        /// <returns>A list of drivers</returns>
        public static IEnumerable<Driver> GetAll()
        {
            const string sql = "SELECT * FROM Drivers ORDER BY Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<Driver>(sql);
            }
        }

        /// <summary>
        /// Gets a driver by their ID
        /// </summary>
        /// <param name="id">The ID of the driver to retrieve</param>
        /// <returns>The driver entity if found, null otherwise</returns>
        public static Driver GetById(int id)
        {
            const string sql = "SELECT * FROM Drivers WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<Driver>(sql, new { Id = id });
            }
        }

        /// <summary>
        /// Gets a driver by their name
        /// </summary>
        /// <param name="name">The name of the driver to retrieve</param>
        /// <returns>The driver entity if found, null otherwise</returns>
        public static Driver GetByName(string name)
        {
            const string sql = "SELECT * FROM Drivers WHERE Name = @Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<Driver>(sql, new { Name = name });
            }
        }

        /// <summary>
        /// Adds a new driver
        /// </summary>
        /// <param name="driver">The driver entity to add</param>
        /// <returns>The ID of the newly added driver</returns>
        public static int Add(Driver driver)
        {
            const string sql = @"
                INSERT INTO Drivers (Name)
                VALUES (@Name);
                SELECT last_insert_rowid();";

            using (var connection = Connection.GetConnection())
            {
                return connection.ExecuteScalar<int>(sql, driver);
            }
        }

        /// <summary>
        /// Updates an existing driver
        /// </summary>
        /// <param name="driver">The driver entity with updated values</param>
        /// <returns>True if the update was successful</returns>
        public static bool Update(Driver driver)
        {
            const string sql = @"
                UPDATE Drivers SET 
                    Name = @Name
                WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, driver) > 0;
            }
        }

        /// <summary>
        /// Deletes a driver by their ID
        /// </summary>
        /// <param name="id">The ID of the driver to delete</param>
        /// <returns>True if the deletion was successful</returns>
        public static bool Delete(int id)
        {
            const string sql = "DELETE FROM Drivers WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id }) > 0;
            }
        }

        /// <summary>
        /// Gets a driver with their related car skins
        /// </summary>
        /// <param name="id">The ID of the driver to retrieve</param>
        /// <returns>The driver entity with their related car skins</returns>
        public static Driver GetWithCarSkins(int id)
        {
            const string sql = @"
                SELECT d.*, cs.*
                FROM Drivers d
                LEFT JOIN Cars_Skins cs ON d.Id = cs.Driver
                WHERE d.Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                var driverDict = new Dictionary<int, Driver>();

                var result = connection.Query<Driver, CarSkin, Driver>(
                    sql,
                    (driver, skin) =>
                    {
                        if (!driverDict.TryGetValue(driver.Id, out var existingDriver))
                        {
                            existingDriver = driver;
                            existingDriver.CarSkins = new List<CarSkin>();
                            driverDict.Add(existingDriver.Id, existingDriver);
                        }

                        if (skin != null)
                        {
                            existingDriver.CarSkins.Add(skin);
                        }

                        return existingDriver;
                    },
                    new { Id = id },
                    splitOn: "Id");

                return driverDict.Values.FirstOrDefault();
            }
        }
    }
}
