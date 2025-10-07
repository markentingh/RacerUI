using Dapper;
using RacerUI.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RacerUI.SQL
{
    public static class CarTypesRepository
    {
        /// <summary>
        /// Gets all car types
        /// </summary>
        /// <returns>A list of car types</returns>
        public static IEnumerable<CarType> GetAll()
        {
            const string sql = "SELECT * FROM CarTypes ORDER BY Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<CarType>(sql);
            }
        }

        /// <summary>
        /// Gets a car type by its ID
        /// </summary>
        /// <param name="id">The ID of the car type to retrieve</param>
        /// <returns>The car type entity if found, null otherwise</returns>
        public static CarType GetById(int id)
        {
            const string sql = "SELECT * FROM CarTypes WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<CarType>(sql, new { Id = id });
            }
        }

        /// <summary>
        /// Gets a car type by its name
        /// </summary>
        /// <param name="name">The name of the car type to retrieve</param>
        /// <returns>The car type entity if found, null otherwise</returns>
        public static CarType GetByName(string name)
        {
            const string sql = "SELECT * FROM CarTypes WHERE Name = @Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<CarType>(sql, new { Name = name });
            }
        }

        /// <summary>
        /// Adds a new car type
        /// </summary>
        /// <param name="carType">The car type entity to add</param>
        /// <returns>The ID of the newly added car type</returns>
        public static int Add(CarType carType)
        {
            const string sql = @"
                INSERT INTO CarTypes (Name)
                VALUES (@Name);
                SELECT last_insert_rowid();";

            using (var connection = Connection.GetConnection())
            {
                return connection.ExecuteScalar<int>(sql, carType);
            }
        }

        /// <summary>
        /// Updates an existing car type
        /// </summary>
        /// <param name="carType">The car type entity with updated values</param>
        /// <returns>True if the update was successful</returns>
        public static bool Update(CarType carType)
        {
            const string sql = @"
                UPDATE CarTypes SET 
                    Name = @Name
                WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, carType) > 0;
            }
        }

        /// <summary>
        /// Deletes a car type by its ID
        /// </summary>
        /// <param name="id">The ID of the car type to delete</param>
        /// <returns>True if the deletion was successful</returns>
        public static bool Delete(int id)
        {
            const string sql = "DELETE FROM CarTypes WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id }) > 0;
            }
        }

        /// <summary>
        /// Gets a car type with its related cars
        /// </summary>
        /// <param name="id">The ID of the car type to retrieve</param>
        /// <returns>The car type entity with its related cars</returns>
        public static CarType GetWithCars(int id)
        {
            const string sql = @"
                SELECT ct.*, c.*
                FROM CarTypes ct
                LEFT JOIN Cars_Types ctt ON ct.Id = ctt.Type
                LEFT JOIN Cars c ON ctt.CarId = c.Id
                WHERE ct.Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                var carTypeDict = new Dictionary<int, CarType>();

                var result = connection.Query<CarType, Car, CarType>(
                    sql,
                    (type, car) =>
                    {
                        if (!carTypeDict.TryGetValue(type.Id, out var carType))
                        {
                            carType = type;
                            carType.Cars = new List<Car>();
                            carTypeDict.Add(carType.Id, carType);
                        }

                        if (car != null)
                        {
                            carType.Cars.Add(car);
                        }

                        return carType;
                    },
                    new { Id = id },
                    splitOn: "Id");

                return carTypeDict.Values.FirstOrDefault();
            }
        }
    }
}
