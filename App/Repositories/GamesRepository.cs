using Dapper;
using RacerUI.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RacerUI.SQL
{
    public static class GamesRepository
    {
        /// <summary>
        /// Gets all games
        /// </summary>
        /// <returns>A list of games</returns>
        public static IEnumerable<Game> GetAll()
        {
            const string sql = "SELECT * FROM Games ORDER BY Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<Game>(sql);
            }
        }

        /// <summary>
        /// Gets a game by its ID
        /// </summary>
        /// <param name="id">The ID of the game to retrieve</param>
        /// <returns>The game entity if found, null otherwise</returns>
        public static Game GetById(int id)
        {
            const string sql = "SELECT * FROM Games WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<Game>(sql, new { Id = id });
            }
        }

        /// <summary>
        /// Gets a game by its name
        /// </summary>
        /// <param name="name">The name of the game to retrieve</param>
        /// <returns>The game entity if found, null otherwise</returns>
        public static Game GetByName(string name)
        {
            const string sql = "SELECT * FROM Games WHERE Name = @Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<Game>(sql, new { Name = name });
            }
        }

        /// <summary>
        /// Gets a game by its path
        /// </summary>
        /// <param name="path">The path of the game to retrieve</param>
        /// <returns>The game entity if found, null otherwise</returns>
        public static Game GetByPath(string path)
        {
            const string sql = "SELECT * FROM Games WHERE Path = @Path";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<Game>(sql, new { Path = path });
            }
        }

        /// <summary>
        /// Adds a new game
        /// </summary>
        /// <param name="game">The game entity to add</param>
        /// <returns>The ID of the newly added game</returns>
        public static int Add(Game game)
        {
            const string sql = @"
                INSERT INTO Games (Name, Path)
                VALUES (@Name, @Path);
                SELECT last_insert_rowid();";

            using (var connection = Connection.GetConnection())
            {
                return connection.ExecuteScalar<int>(sql, game);
            }
        }

        /// <summary>
        /// Updates an existing game
        /// </summary>
        /// <param name="game">The game entity with updated values</param>
        /// <returns>True if the update was successful</returns>
        public static bool Update(Game game)
        {
            const string sql = @"
                UPDATE Games SET 
                    Name = @Name,
                    Path = @Path
                WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, game) > 0;
            }
        }

        /// <summary>
        /// Deletes a game by its ID
        /// </summary>
        /// <param name="id">The ID of the game to delete</param>
        /// <returns>True if the deletion was successful</returns>
        public static bool Delete(int id)
        {
            const string sql = "DELETE FROM Games WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id }) > 0;
            }
        }

        /// <summary>
        /// Gets a game with its related cars
        /// </summary>
        /// <param name="id">The ID of the game to retrieve</param>
        /// <returns>The game entity with its related cars</returns>
        public static Game GetWithCars(int id)
        {
            const string sql = @"
                SELECT g.*, c.*
                FROM Games g
                LEFT JOIN Cars c ON g.Id = c.GameId
                WHERE g.Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                var gameDict = new Dictionary<int, Game>();

                var result = connection.Query<Game, Car, Game>(
                    sql,
                    (game, car) =>
                    {
                        if (!gameDict.TryGetValue(game.Id, out var existingGame))
                        {
                            existingGame = game;
                            existingGame.Cars = new List<Car>();
                            gameDict.Add(existingGame.Id, existingGame);
                        }

                        if (car != null)
                        {
                            existingGame.Cars.Add(car);
                        }

                        return existingGame;
                    },
                    new { Id = id },
                    splitOn: "Id");

                return gameDict.Values.FirstOrDefault();
            }
        }
    }
}
