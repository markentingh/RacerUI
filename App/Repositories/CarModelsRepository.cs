using Dapper;
using RacerUI.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RacerUI.SQL
{
    public static class CarModelsRepository
    {
        /// <summary>
        /// Gets all car models
        /// </summary>
        /// <returns>A list of car models</returns>
        public static IEnumerable<CarModel> GetAll()
        {
            const string sql = "SELECT * FROM CarModels ORDER BY Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<CarModel>(sql);
            }
        }

        /// <summary>
        /// Gets a car model by its ID
        /// </summary>
        /// <param name="id">The ID of the car model to retrieve</param>
        /// <returns>The car model entity if found, null otherwise</returns>
        public static CarModel GetById(int id)
        {
            const string sql = "SELECT * FROM CarModels WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<CarModel>(sql, new { Id = id });
            }
        }

        /// <summary>
        /// Gets a car model by its name
        /// </summary>
        /// <param name="name">The name of the car model to retrieve</param>
        /// <returns>The car model entity if found, null otherwise</returns>
        public static CarModel GetByName(string name)
        {
            const string sql = "SELECT * FROM CarModels WHERE Name = @Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<CarModel>(sql, new { Name = name });
            }
        }

        /// <summary>
        /// Adds a new car model
        /// </summary>
        /// <param name="carModel">The car model entity to add</param>
        /// <returns>The ID of the newly added car model</returns>
        public static int Add(CarModel carModel)
        {
            const string sql = @"
                INSERT INTO CarModels (Name)
                VALUES (@Name);
                SELECT last_insert_rowid();";

            using (var connection = Connection.GetConnection())
            {
                return connection.ExecuteScalar<int>(sql, carModel);
            }
        }

        /// <summary>
        /// Updates an existing car model
        /// </summary>
        /// <param name="carModel">The car model entity with updated values</param>
        /// <returns>True if the update was successful</returns>
        public static bool Update(CarModel carModel)
        {
            const string sql = @"
                UPDATE CarModels SET 
                    Name = @Name
                WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, carModel) > 0;
            }
        }

        /// <summary>
        /// Deletes a car model by its ID
        /// </summary>
        /// <param name="id">The ID of the car model to delete</param>
        /// <returns>True if the deletion was successful</returns>
        public static bool Delete(int id)
        {
            const string sql = "DELETE FROM CarModels WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id }) > 0;
            }
        }

        /// <summary>
        /// Gets a car model with its related cars
        /// </summary>
        /// <param name="id">The ID of the car model to retrieve</param>
        /// <returns>The car model entity with its related cars</returns>
        public static CarModel GetWithCars(int id)
        {
            const string sql = @"
                SELECT m.*, c.*
                FROM CarModels m
                LEFT JOIN Cars c ON c.Model = m.Id
                WHERE m.Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                var carModelDict = new Dictionary<int, CarModel>();

                var result = connection.Query<CarModel, Car, CarModel>(
                    sql,
                    (model, car) =>
                    {
                        if (!carModelDict.TryGetValue(model.Id, out var carModel))
                        {
                            carModel = model;
                            carModel.Cars = new List<Car>();
                            carModelDict.Add(carModel.Id, carModel);
                        }

                        if (car != null)
                        {
                            carModel.Cars.Add(car);
                        }

                        return carModel;
                    },
                    new { Id = id },
                    splitOn: "Id");

                return carModelDict.Values.FirstOrDefault();
            }
        }
    }
}
