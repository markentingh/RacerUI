using Dapper;
using RacerUI.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RacerUI.SQL
{
    public static class CarMakesRepository
    {
        /// <summary>
        /// Gets all car makes
        /// </summary>
        /// <returns>A list of car makes</returns>
        public static IEnumerable<CarMake> GetAll()
        {
            const string sql = "SELECT * FROM CarMakes ORDER BY Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<CarMake>(sql);
            }
        }

        /// <summary>
        /// Gets a car make by its ID
        /// </summary>
        /// <param name="id">The ID of the car make to retrieve</param>
        /// <returns>The car make entity if found, null otherwise</returns>
        public static CarMake GetById(int id)
        {
            const string sql = "SELECT * FROM CarMakes WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<CarMake>(sql, new { Id = id });
            }
        }

        /// <summary>
        /// Gets a car make by its name
        /// </summary>
        /// <param name="name">The name of the car make to retrieve</param>
        /// <returns>The car make entity if found, null otherwise</returns>
        public static CarMake GetByName(string name)
        {
            const string sql = "SELECT * FROM CarMakes WHERE Name = @Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<CarMake>(sql, new { Name = name });
            }
        }

        /// <summary>
        /// Adds a new car make
        /// </summary>
        /// <param name="carMake">The car make entity to add</param>
        /// <returns>The ID of the newly added car make</returns>
        public static int Add(CarMake carMake)
        {
            const string sql = @"
                INSERT INTO CarMakes (Name, Logo)
                VALUES (@Name, @Logo);
                SELECT last_insert_rowid();";

            using (var connection = Connection.GetConnection())
            {
                return connection.ExecuteScalar<int>(sql, carMake);
            }
        }

        /// <summary>
        /// Updates an existing car make
        /// </summary>
        /// <param name="carMake">The car make entity with updated values</param>
        /// <returns>True if the update was successful</returns>
        public static bool Update(CarMake carMake)
        {
            const string sql = @"
                UPDATE CarMakes SET 
                    Name = @Name,
                    Logo = @Logo
                WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, carMake) > 0;
            }
        }

        /// <summary>
        /// Deletes a car make by its ID
        /// </summary>
        /// <param name="id">The ID of the car make to delete</param>
        /// <returns>True if the deletion was successful</returns>
        public static bool Delete(int id)
        {
            const string sql = "DELETE FROM CarMakes WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id }) > 0;
            }
        }

        /// <summary>
        /// Gets a car make with its related cars
        /// </summary>
        /// <param name="id">The ID of the car make to retrieve</param>
        /// <returns>The car make entity with its related cars</returns>
        public static CarMake GetWithCars(int id)
        {
            const string sql = @"
                SELECT m.*, c.*
                FROM CarMakes m
                LEFT JOIN Cars c ON c.Make = m.Id
                WHERE m.Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                var carMakeDict = new Dictionary<int, CarMake>();

                var result = connection.Query<CarMake, Car, CarMake>(
                    sql,
                    (make, car) =>
                    {
                        if (!carMakeDict.TryGetValue(make.Id, out var carMake))
                        {
                            carMake = make;
                            carMake.Cars = new List<Car>();
                            carMakeDict.Add(carMake.Id, carMake);
                        }

                        if (car != null)
                        {
                            carMake.Cars.Add(car);
                        }

                        return carMake;
                    },
                    new { Id = id },
                    splitOn: "Id");

                return carMakeDict.Values.FirstOrDefault();
            }
        }
    }
}
