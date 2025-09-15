using Dapper;
using RacerUI.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RacerUI.SQL
{
    public static class CarTagsRepository
    {
        /// <summary>
        /// Gets all car tags
        /// </summary>
        /// <returns>A list of car tags</returns>
        public static IEnumerable<CarTag> GetAll()
        {
            const string sql = "SELECT * FROM CarTags ORDER BY Tag";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<CarTag>(sql);
            }
        }

        /// <summary>
        /// Gets a car tag by its ID
        /// </summary>
        /// <param name="id">The ID of the car tag to retrieve</param>
        /// <returns>The car tag entity if found, null otherwise</returns>
        public static CarTag GetById(int id)
        {
            const string sql = "SELECT * FROM CarTags WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<CarTag>(sql, new { Id = id });
            }
        }

        /// <summary>
        /// Gets a car tag by its tag value
        /// </summary>
        /// <param name="tag">The tag value to retrieve</param>
        /// <returns>The car tag entity if found, null otherwise</returns>
        public static CarTag GetByTag(string tag)
        {
            const string sql = "SELECT * FROM CarTags WHERE Tag = @Tag";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<CarTag>(sql, new { Tag = tag });
            }
        }

        /// <summary>
        /// Adds a new car tag
        /// </summary>
        /// <param name="carTag">The car tag entity to add</param>
        /// <returns>The ID of the newly added car tag</returns>
        public static int Add(CarTag carTag)
        {
            const string sql = @"
                INSERT INTO CarTags (Tag)
                VALUES (@Tag);
                SELECT last_insert_rowid();";

            using (var connection = Connection.GetConnection())
            {
                return connection.ExecuteScalar<int>(sql, carTag);
            }
        }

        /// <summary>
        /// Updates an existing car tag
        /// </summary>
        /// <param name="carTag">The car tag entity with updated values</param>
        /// <returns>True if the update was successful</returns>
        public static bool Update(CarTag carTag)
        {
            const string sql = @"
                UPDATE CarTags SET 
                    Tag = @Tag
                WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, carTag) > 0;
            }
        }

        /// <summary>
        /// Deletes a car tag by its ID
        /// </summary>
        /// <param name="id">The ID of the car tag to delete</param>
        /// <returns>True if the deletion was successful</returns>
        public static bool Delete(int id)
        {
            const string sql = "DELETE FROM CarTags WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id }) > 0;
            }
        }

        /// <summary>
        /// Gets a car tag with its related cars
        /// </summary>
        /// <param name="id">The ID of the car tag to retrieve</param>
        /// <returns>The car tag entity with its related cars</returns>
        public static CarTag GetWithCars(int id)
        {
            const string sql = @"
                SELECT ct.*, c.*
                FROM CarTags ct
                LEFT JOIN Cars_Tags ctt ON ct.Id = ctt.TagId
                LEFT JOIN Cars c ON ctt.CarId = c.Id
                WHERE ct.Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                var carTagDict = new Dictionary<int, CarTag>();

                var result = connection.Query<CarTag, Car, CarTag>(
                    sql,
                    (tag, car) =>
                    {
                        if (!carTagDict.TryGetValue(tag.Id, out var carTag))
                        {
                            carTag = tag;
                            carTag.Cars = new List<Car>();
                            carTagDict.Add(carTag.Id, carTag);
                        }

                        if (car != null)
                        {
                            carTag.Cars.Add(car);
                        }

                        return carTag;
                    },
                    new { Id = id },
                    splitOn: "Id");

                return carTagDict.Values.FirstOrDefault();
            }
        }
    }
}
