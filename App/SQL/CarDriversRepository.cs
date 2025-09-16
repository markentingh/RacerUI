using Dapper;
using RacerUI.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RacerUI.SQL
{
    public static class CarDriversRepository
    {
        /// <summary>
        /// Gets all car-driver relationships
        /// </summary>
        /// <returns>A list of car-driver relationships</returns>
        public static IEnumerable<CarDriver> GetAll()
        {
            const string sql = "SELECT * FROM Cars_Drivers";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<CarDriver>(sql);
            }
        }

        /// <summary>
        /// Gets all car-driver relationships for a specific car
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <returns>A list of car-driver relationships for the specified car</returns>
        public static IEnumerable<CarDriver> GetByCarId(int carId)
        {
            const string sql = "SELECT * FROM Cars_Drivers WHERE CarId = @CarId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<CarDriver>(sql, new { CarId = carId });
            }
        }

        /// <summary>
        /// Gets all car-driver relationships for a specific driver
        /// </summary>
        /// <param name="driverId">The ID of the driver</param>
        /// <returns>A list of car-driver relationships for the specified driver</returns>
        public static IEnumerable<CarDriver> GetByDriverId(int driverId)
        {
            const string sql = "SELECT * FROM Cars_Drivers WHERE DriverId = @DriverId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<CarDriver>(sql, new { DriverId = driverId });
            }
        }

        /// <summary>
        /// Gets all car-driver relationships for a specific skin
        /// </summary>
        /// <param name="skinId">The ID of the skin</param>
        /// <returns>A list of car-driver relationships for the specified skin</returns>
        public static IEnumerable<CarDriver> GetBySkinId(int skinId)
        {
            const string sql = "SELECT * FROM Cars_Drivers WHERE SkinId = @SkinId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<CarDriver>(sql, new { SkinId = skinId });
            }
        }

        /// <summary>
        /// Gets a specific car-driver relationship
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <param name="driverId">The ID of the driver</param>
        /// <returns>The car-driver relationship if found, null otherwise</returns>
        public static CarDriver GetByCarAndDriverId(int carId, int driverId)
        {
            const string sql = "SELECT * FROM Cars_Drivers WHERE CarId = @CarId AND DriverId = @DriverId";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<CarDriver>(sql, new { CarId = carId, DriverId = driverId });
            }
        }

        /// <summary>
        /// Adds a new car-driver relationship
        /// </summary>
        /// <param name="carDriver">The car-driver entity to add</param>
        /// <returns>True if the addition was successful</returns>
        public static bool Add(CarDriver carDriver)
        {
            const string sql = @"
                INSERT INTO Cars_Drivers (CarId, DriverId, SkinId)
                VALUES (@CarId, @DriverId, @SkinId)";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, carDriver) > 0;
            }
        }

        /// <summary>
        /// Updates an existing car-driver relationship
        /// </summary>
        /// <param name="carDriver">The car-driver entity with updated values</param>
        /// <returns>True if the update was successful</returns>
        public static bool Update(CarDriver carDriver)
        {
            const string sql = @"
                UPDATE Cars_Drivers SET 
                    SkinId = @SkinId
                WHERE CarId = @CarId AND DriverId = @DriverId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, carDriver) > 0;
            }
        }

        /// <summary>
        /// Deletes a car-driver relationship
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <param name="driverId">The ID of the driver</param>
        /// <returns>True if the deletion was successful</returns>
        public static bool Delete(int carId, int driverId)
        {
            const string sql = "DELETE FROM Cars_Drivers WHERE CarId = @CarId AND DriverId = @DriverId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { CarId = carId, DriverId = driverId }) > 0;
            }
        }

        public static bool DeleteBySkinId(int skinId)
        {
            const string sql = "DELETE FROM Cars_Drivers WHERE SkinId = @SkinId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { SkinId = skinId }) > 0;
            }
        }
    }
}
