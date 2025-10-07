using Dapper;
using RacerUI.Entities;

namespace RacerUI.SQL
{
    public static class CarSpecializationsRepository
    {
        /// <summary>
        /// Gets all specializations for a specific car
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <returns>A list of racing specializations for the specified car</returns>
        public static IEnumerable<RacingSpecialization> GetByCarId(int carId)
        {
            const string sql = @"
                SELECT rs.*
                FROM RacingSpecializations rs
                JOIN Cars_Specializations cs ON rs.Id = cs.Specialization
                WHERE cs.CarId = @CarId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<RacingSpecialization>(sql, new { CarId = carId });
            }
        }

        /// <summary>
        /// Gets all cars for a specific specialization
        /// </summary>
        /// <param name="specializationId">The ID of the specialization</param>
        /// <returns>A list of cars with the specified specialization</returns>
        public static IEnumerable<Car> GetCarsBySpecializationId(int specializationId)
        {
            const string sql = @"
                SELECT c.*
                FROM Cars c
                JOIN Cars_Specializations cs ON c.Id = cs.CarId
                WHERE cs.Specialization = @SpecializationId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<Car>(sql, new { SpecializationId = specializationId });
            }
        }

        /// <summary>
        /// Associates a car with a specialization
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <param name="specializationId">The ID of the specialization</param>
        /// <returns>True if the association was successful</returns>
        public static bool Associate(int carId, int specializationId)
        {
            const string sql = @"
                INSERT INTO Cars_Specializations (CarId, Specialization)
                VALUES (@CarId, @SpecializationId)";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { CarId = carId, SpecializationId = specializationId }) > 0;
            }
        }

        /// <summary>
        /// Removes the association between a car and a specialization
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <param name="specializationId">The ID of the specialization</param>
        /// <returns>True if the removal was successful</returns>
        public static bool Dissociate(int carId, int specializationId)
        {
            const string sql = @"
                DELETE FROM Cars_Specializations 
                WHERE CarId = @CarId AND Specialization = @SpecializationId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { CarId = carId, SpecializationId = specializationId }) > 0;
            }
        }

        /// <summary>
        /// Removes all specializations for a specific car
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <returns>True if the removal was successful</returns>
        public static bool RemoveAllForCar(int carId)
        {
            const string sql = "DELETE FROM Cars_Specializations WHERE CarId = @CarId";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { CarId = carId }) > 0;
            }
        }

        /// <summary>
        /// Sets the specializations for a car, removing any existing associations
        /// </summary>
        /// <param name="carId">The ID of the car</param>
        /// <param name="specializationIds">The IDs of the specializations to associate with the car</param>
        /// <returns>True if the operation was successful</returns>
        public static bool SetForCar(int carId, IEnumerable<int> specializationIds)
        {
            using (var connection = Connection.GetConnection())
            {
                using (var transaction = connection.BeginTransaction())
                {
                    try
                    {
                        // Remove existing associations
                        connection.Execute(
                            "DELETE FROM Cars_Specializations WHERE CarId = @CarId",
                            new { CarId = carId },
                            transaction);

                        // Add new associations
                        if (specializationIds != null && specializationIds.Any())
                        {
                            foreach (var specializationId in specializationIds)
                            {
                                connection.Execute(
                                    "INSERT INTO Cars_Specializations (CarId, Specialization) VALUES (@CarId, @SpecializationId)",
                                    new { CarId = carId, SpecializationId = specializationId },
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
