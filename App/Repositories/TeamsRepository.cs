using Dapper;
using RacerUI.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RacerUI.SQL
{
    public static class TeamsRepository
    {
        /// <summary>
        /// Gets all teams
        /// </summary>
        /// <returns>A list of teams</returns>
        public static IEnumerable<Team> GetAll()
        {
            const string sql = "SELECT * FROM Teams ORDER BY Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<Team>(sql);
            }
        }

        /// <summary>
        /// Gets a team by its ID
        /// </summary>
        /// <param name="id">The ID of the team to retrieve</param>
        /// <returns>The team entity if found, null otherwise</returns>
        public static Team GetById(int id)
        {
            const string sql = "SELECT * FROM Teams WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<Team>(sql, new { Id = id });
            }
        }

        /// <summary>
        /// Gets a team by its name
        /// </summary>
        /// <param name="name">The name of the team to retrieve</param>
        /// <returns>The team entity if found, null otherwise</returns>
        public static Team GetByName(string name)
        {
            const string sql = "SELECT * FROM Teams WHERE Name = @Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<Team>(sql, new { Name = name });
            }
        }

        /// <summary>
        /// Adds a new team
        /// </summary>
        /// <param name="team">The team entity to add</param>
        /// <returns>The ID of the newly added team</returns>
        public static int Add(Team team)
        {
            const string sql = @"
                INSERT INTO Teams (Name, Website, Logo)
                VALUES (@Name, @Website, @Logo);
                SELECT last_insert_rowid();";

            using (var connection = Connection.GetConnection())
            {
                return connection.ExecuteScalar<int>(sql, team);
            }
        }

        /// <summary>
        /// Updates an existing team
        /// </summary>
        /// <param name="team">The team entity with updated values</param>
        /// <returns>True if the update was successful</returns>
        public static bool Update(Team team)
        {
            const string sql = @"
                UPDATE Teams SET 
                    Name = @Name,
                    Website = @Website,
                    Logo = @Logo
                WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, team) > 0;
            }
        }

        /// <summary>
        /// Deletes a team by its ID
        /// </summary>
        /// <param name="id">The ID of the team to delete</param>
        /// <returns>True if the deletion was successful</returns>
        public static bool Delete(int id)
        {
            const string sql = "DELETE FROM Teams WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id }) > 0;
            }
        }

        /// <summary>
        /// Gets a team with its related cars
        /// </summary>
        /// <param name="id">The ID of the team to retrieve</param>
        /// <returns>The team entity with its related cars</returns>
        public static Team GetWithCars(int id)
        {
            const string sql = @"
                SELECT t.*, c.*
                FROM Teams t
                LEFT JOIN Cars c ON t.Id = c.Team
                WHERE t.Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                var teamDict = new Dictionary<int, Team>();

                var result = connection.Query<Team, Car, Team>(
                    sql,
                    (team, car) =>
                    {
                        if (!teamDict.TryGetValue(team.Id, out var existingTeam))
                        {
                            existingTeam = team;
                            existingTeam.Cars = new List<Car>();
                            teamDict.Add(existingTeam.Id, existingTeam);
                        }

                        if (car != null)
                        {
                            existingTeam.Cars.Add(car);
                        }

                        return existingTeam;
                    },
                    new { Id = id },
                    splitOn: "Id");

                return teamDict.Values.FirstOrDefault();
            }
        }
    }
}
