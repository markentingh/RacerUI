using Dapper;
using RacerUI.Entities;
using System.Collections.Generic;

namespace RacerUI.SQL
{
    public static class CountryRepository
    {
        public static IEnumerable<Country> GetAll()
        {
            const string sql = "SELECT * FROM Countries ORDER BY Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<Country>(sql);
            }
        }

        public static Country GetByName(string name)
        {
            const string sql = "SELECT * FROM Countries WHERE Name = @Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<Country>(sql, new { Name = name });
            }
        }

        public static Country GetByCode(string code)
        {
            const string sql = "SELECT * FROM Countries WHERE Code = @Code";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<Country>(sql, new { Code = code });
            }
        }

        public static void Add(Country country)
        {
            const string sql = @"
                INSERT INTO Countries (Name, Code)
                VALUES (@Name, @Code);";

            using (var connection = Connection.GetConnection())
            {
                connection.Execute(sql, country);
            }
        }

        public static bool Update(Country country)
        {
            const string sql = @"
                UPDATE Countries SET 
                    Code = @Code
                WHERE Name = @Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, country) > 0;
            }
        }

        public static bool Delete(string name)
        {
            const string sql = "DELETE FROM Countries WHERE Name = @Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Name = name }) > 0;
            }
        }

        public static Country FindOrCreate(string name, string code)
        {
            var country = GetByName(name);
            if (country == null)
            {
                var newCountry = new Country { Name = name, Code = code };
                Add(newCountry);
                return newCountry;
            }
            return country;
        }
    }
}
