using Dapper;
using RacerUI.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RacerUI.SQL
{
    public static class CarTypeMappingRepository
    {
        /// <summary>
        /// Gets all types for a specific car
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <returns>A list of car types for the specified car</returns>
        public static IEnumerable<CarType> GetByCarId(int carId)
        {
            const string sql = @"
                SELECT ct.*
                FROM CarTypes ct
                JOIN Cars_Types ctt ON ct.Id = ctt.Type
                WHERE ctt.CarId = @CarId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<CarType>(sql, new { CarId = carId });
            }
        }

        /// <summary>
        /// Gets all cars with a specific type
        /// </summary>
        /// <param name="typeId">The ID of the type</param>
        /// <returns>A list of cars with the specified type</returns>
        public static IEnumerable<Car> GetCarsByTypeId(int typeId)
        {
            const string sql = @"
                SELECT c.*
                FROM Cars c
                JOIN Cars_Types ctt ON c.Id = ctt.CarId
                WHERE ctt.Type = @TypeId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<Car>(sql, new { TypeId = typeId });
            }
        }

        /// <summary>
        /// Associates a car with a type
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <param name="typeId">The ID of the type</param>
        /// <returns>True if the association was successful</returns>
        public static bool Associate(int carId, int typeId)
        {
            const string sql = @"
                INSERT INTO Cars_Types (CarId, Type)
                VALUES (@CarId, @TypeId)";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { CarId = carId, TypeId = typeId }) > 0;
            }
        }

        /// <summary>
        /// Removes the association between a car and a type
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <param name="typeId">The ID of the type</param>
        /// <returns>True if the removal was successful</returns>
        public static bool Dissociate(int carId, int typeId)
        {
            const string sql = @"
                DELETE FROM Cars_Types 
                WHERE CarId = @CarId AND Type = @TypeId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { CarId = carId, TypeId = typeId }) > 0;
            }
        }

        /// <summary>
        /// Removes all types for a specific car
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <returns>True if the removal was successful</returns>
        public static bool RemoveAllForCar(int carId)
        {
            const string sql = "DELETE FROM Cars_Types WHERE CarId = @CarId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { CarId = carId }) > 0;
            }
        }

        /// <summary>
        /// Sets the types for a car, removing any existing associations
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <param name="typeIds">The IDs of the types to associate with the car</param>
        /// <returns>True if the operation was successful</returns>
        public static bool SetForCar(int carId, IEnumerable<int> typeIds)
        {
            using (var connection = Connection.GetConnection())
            {
                using (var transaction = connection.BeginTransaction())
                {
                    try
                    {
                        // Remove existing associations
                        connection.Execute(
                            "DELETE FROM Cars_Types WHERE CarId = @CarId",
                            new { CarId = carId },
                            transaction);

                        // Add new associations
                        if (typeIds != null && typeIds.Any())
                        {
                            foreach (var typeId in typeIds)
                            {
                                connection.Execute(
                                    "INSERT INTO Cars_Types (CarId, TypeId) VALUES (@CarId, @TypeId)",
                                    new { CarId = carId, TypeId = typeId },
                                    transaction);
                            }
                        }

                        transaction.Commit();
                        return true;
                    }
                    catch
                    {
                        transaction.Rollback();
                        throw;
                    }
                }
            }
        }
    }
}
