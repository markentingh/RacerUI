using Dapper;
using RacerUI.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RacerUI.SQL
{
    public static class CarTagMappingRepository
    {
        /// <summary>
        /// Gets all tags for a specific car
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <returns>A list of car tags for the specified car</returns>
        public static IEnumerable<CarTag> GetByCarId(int carId)
        {
            const string sql = @"
                SELECT ct.*
                FROM CarTags ct
                JOIN Cars_Tags ctt ON ct.Id = ctt.TagId
                WHERE ctt.CarId = @CarId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<CarTag>(sql, new { CarId = carId });
            }
        }

        /// <summary>
        /// Gets all cars with a specific tag
        /// </summary>
        /// <param name="tagId">The ID of the tag</param>
        /// <returns>A list of cars with the specified tag</returns>
        public static IEnumerable<Car> GetCarsByTagId(int tagId)
        {
            const string sql = @"
                SELECT c.*
                FROM Cars c
                JOIN Cars_Tags ctt ON c.Id = ctt.CarId
                WHERE ctt.TagId = @TagId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<Car>(sql, new { TagId = tagId });
            }
        }

        /// <summary>
        /// Associates a car with a tag
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <param name="tagId">The ID of the tag</param>
        /// <returns>True if the association was successful</returns>
        public static bool Associate(int carId, int tagId)
        {
            const string sql = @"
                INSERT INTO Cars_Tags (CarId, TagId)
                VALUES (@CarId, @TagId)";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { CarId = carId, TagId = tagId }) > 0;
            }
        }

        /// <summary>
        /// Removes the association between a car and a tag
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <param name="tagId">The ID of the tag</param>
        /// <returns>True if the removal was successful</returns>
        public static bool Dissociate(int carId, int tagId)
        {
            const string sql = @"
                DELETE FROM Cars_Tags 
                WHERE CarId = @CarId AND TagId = @TagId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { CarId = carId, TagId = tagId }) > 0;
            }
        }

        /// <summary>
        /// Removes all tags for a specific car
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <returns>True if the removal was successful</returns>
        public static bool RemoveAllForCar(int carId)
        {
            const string sql = "DELETE FROM Cars_Tags WHERE CarId = @CarId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { CarId = carId }) > 0;
            }
        }

        /// <summary>
        /// Sets the tags for a car, removing any existing associations
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <param name="tagIds">The IDs of the tags to associate with the car</param>
        /// <returns>True if the operation was successful</returns>
        public static bool SetForCar(int carId, IEnumerable<int> tagIds)
        {
            using (var connection = Connection.GetConnection())
            {
                using (var transaction = connection.BeginTransaction())
                {
                    try
                    {
                        // Remove existing associations
                        connection.Execute(
                            "DELETE FROM Cars_Tags WHERE CarId = @CarId",
                            new { CarId = carId },
                            transaction);

                        // Add new associations
                        if (tagIds != null && tagIds.Any())
                        {
                            foreach (var tagId in tagIds)
                            {
                                connection.Execute(
                                    "INSERT INTO Cars_Tags (CarId, TagId) VALUES (@CarId, @TagId)",
                                    new { CarId = carId, TagId = tagId },
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
