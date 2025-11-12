using Dapper;
using RacerUI.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RacerUI.SQL
{
    public static class CarStylingMappingRepository
    {
        /// <summary>
        /// Gets all styling options for a specific car
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <returns>A list of car styling options for the specified car</returns>
        public static IEnumerable<CarStyling> GetByCarId(int carId)
        {
            const string sql = @"
                SELECT cs.*
                FROM CarStyling cs
                JOIN Cars_Styling css ON cs.Id = css.Styling
                WHERE css.CarId = @CarId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<CarStyling>(sql, new { CarId = carId });
            }
        }

        /// <summary>
        /// Gets all cars with a specific styling option
        /// </summary>
        /// <param name="stylingId">The ID of the styling option</param>
        /// <returns>A list of cars with the specified styling option</returns>
        public static IEnumerable<Car> GetCarsByStylingId(int stylingId)
        {
            const string sql = @"
                SELECT c.*
                FROM Cars c
                JOIN Cars_Styling css ON c.Id = css.CarId
                WHERE css.Styling = @StylingId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<Car>(sql, new { StylingId = stylingId });
            }
        }

        /// <summary>
        /// Associates a car with a styling option
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <param name="stylingId">The ID of the styling option</param>
        /// <returns>True if the association was successful</returns>
        public static bool Associate(int carId, int stylingId)
        {
            const string sql = @"
                INSERT INTO Cars_Styling (CarId, Styling)
                VALUES (@CarId, @StylingId)";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { CarId = carId, StylingId = stylingId }) > 0;
            }
        }

        /// <summary>
        /// Removes the association between a car and a styling option
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <param name="stylingId">The ID of the styling option</param>
        /// <returns>True if the removal was successful</returns>
        public static bool Dissociate(int carId, int stylingId)
        {
            const string sql = @"
                DELETE FROM Cars_Styling 
                WHERE CarId = @CarId AND Styling = @StylingId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { CarId = carId, StylingId = stylingId }) > 0;
            }
        }

        /// <summary>
        /// Removes all styling options for a specific car
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <returns>True if the removal was successful</returns>
        public static bool RemoveAllForCar(int carId)
        {
            const string sql = "DELETE FROM Cars_Styling WHERE CarId = @CarId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { CarId = carId }) > 0;
            }
        }

        /// <summary>
        /// Sets the styling options for a car, removing any existing associations
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <param name="stylingIds">The IDs of the styling options to associate with the car</param>
        /// <returns>True if the operation was successful</returns>
        public static bool SetForCar(int carId, IEnumerable<int> stylingIds)
        {
            using (var connection = Connection.GetConnection())
            {
                using (var transaction = connection.BeginTransaction())
                {
                    try
                    {
                        // Remove existing associations
                        connection.Execute(
                            "DELETE FROM Cars_Styling WHERE CarId = @CarId",
                            new { CarId = carId },
                            transaction);

                        // Add new associations
                        if (stylingIds != null && stylingIds.Any())
                        {
                            foreach (var stylingId in stylingIds)
                            {
                                connection.Execute(
                                    "INSERT INTO Cars_Styling (CarId, StylingId) VALUES (@CarId, @StylingId)",
                                    new { CarId = carId, StylingId = stylingId },
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
