using Dapper;
using RacerUI.Entities;
using System.Collections.Generic;
using System.Linq;

namespace RacerUI.SQL
{
    public static class CarsRepositoryFilterHelpers
    {
        /// <summary>
        /// Gets distinct countries that have cars matching the current filter criteria.
        /// </summary>
        public static IEnumerable<string> GetAvailableCountries(
            IEnumerable<int> makeIds = null,
            IEnumerable<int> years = null,
            IEnumerable<string> classes = null,
            IEnumerable<int> typeIds = null,
            IEnumerable<int> styleIds = null,
            IEnumerable<int> specializationIds = null,
            string searchText = null)
        {
            var sql = "SELECT DISTINCT c.Country FROM Cars c";
            var parameters = new DynamicParameters();
            var whereClauses = new List<string>();
            var joins = new List<string>();

            BuildFilterJoinsAndWhere(ref joins, ref whereClauses, ref parameters, 
                null, makeIds, years, classes, typeIds, styleIds, specializationIds, searchText);

            if (joins.Any())
                sql += " " + string.Join(" ", joins);

            if (whereClauses.Any())
                sql += " WHERE " + string.Join(" AND ", whereClauses);

            sql += " ORDER BY c.Country";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<string>(sql, parameters).Where(c => !string.IsNullOrEmpty(c));
            }
        }

        /// <summary>
        /// Gets distinct manufacturers that have cars matching the current filter criteria.
        /// </summary>
        public static IEnumerable<dynamic> GetAvailableMakes(
            IEnumerable<string> countryCodes = null,
            IEnumerable<int> years = null,
            IEnumerable<string> classes = null,
            IEnumerable<int> typeIds = null,
            IEnumerable<int> styleIds = null,
            IEnumerable<int> specializationIds = null,
            string searchText = null)
        {
            var sql = "SELECT DISTINCT m.Id, m.Name FROM CarMakes m INNER JOIN Cars c ON m.Id = c.MakeId";
            var parameters = new DynamicParameters();
            var whereClauses = new List<string>();
            var joins = new List<string>();

            BuildFilterJoinsAndWhere(ref joins, ref whereClauses, ref parameters, 
                countryCodes, null, years, classes, typeIds, styleIds, specializationIds, searchText);

            if (joins.Any())
                sql += " " + string.Join(" ", joins);

            if (whereClauses.Any())
                sql += " WHERE " + string.Join(" AND ", whereClauses);

            sql += " ORDER BY m.Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query(sql, parameters);
            }
        }

        /// <summary>
        /// Gets distinct years that have cars matching the current filter criteria.
        /// </summary>
        public static IEnumerable<int> GetAvailableYears(
            IEnumerable<string> countryCodes = null,
            IEnumerable<int> makeIds = null,
            IEnumerable<string> classes = null,
            IEnumerable<int> typeIds = null,
            IEnumerable<int> styleIds = null,
            IEnumerable<int> specializationIds = null,
            string searchText = null)
        {
            var sql = "SELECT DISTINCT c.Year FROM Cars c";
            var parameters = new DynamicParameters();
            var whereClauses = new List<string>();
            var joins = new List<string>();

            BuildFilterJoinsAndWhere(ref joins, ref whereClauses, ref parameters, 
                countryCodes, makeIds, null, classes, typeIds, styleIds, specializationIds, searchText);

            if (joins.Any())
                sql += " " + string.Join(" ", joins);

            if (whereClauses.Any())
                sql += " WHERE " + string.Join(" AND ", whereClauses);

            sql += " ORDER BY c.Year DESC";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<int>(sql, parameters);
            }
        }

        /// <summary>
        /// Gets distinct classes that have cars matching the current filter criteria.
        /// </summary>
        public static IEnumerable<string> GetAvailableClasses(
            IEnumerable<string> countryCodes = null,
            IEnumerable<int> makeIds = null,
            IEnumerable<int> years = null,
            IEnumerable<int> typeIds = null,
            IEnumerable<int> styleIds = null,
            IEnumerable<int> specializationIds = null,
            string searchText = null)
        {
            var sql = "SELECT DISTINCT c.Class FROM Cars c";
            var parameters = new DynamicParameters();
            var whereClauses = new List<string>();
            var joins = new List<string>();

            BuildFilterJoinsAndWhere(ref joins, ref whereClauses, ref parameters, 
                countryCodes, makeIds, years, null, typeIds, styleIds, specializationIds, searchText);

            if (joins.Any())
                sql += " " + string.Join(" ", joins);

            if (whereClauses.Any())
                sql += " WHERE " + string.Join(" AND ", whereClauses);

            sql += " ORDER BY c.Class";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<string>(sql, parameters).Where(c => !string.IsNullOrEmpty(c));
            }
        }

        /// <summary>
        /// Gets distinct types that have cars matching the current filter criteria.
        /// </summary>
        public static IEnumerable<dynamic> GetAvailableTypes(
            IEnumerable<string> countryCodes = null,
            IEnumerable<int> makeIds = null,
            IEnumerable<int> years = null,
            IEnumerable<string> classes = null,
            IEnumerable<int> styleIds = null,
            IEnumerable<int> specializationIds = null,
            string searchText = null)
        {
            var sql = "SELECT DISTINCT t.Id, t.Name FROM CarTypes t INNER JOIN Cars_Types ct ON t.Id = ct.TypeId INNER JOIN Cars c ON ct.CarId = c.Id";
            var parameters = new DynamicParameters();
            var whereClauses = new List<string>();
            var joins = new List<string>();

            BuildFilterJoinsAndWhere(ref joins, ref whereClauses, ref parameters, 
                countryCodes, makeIds, years, classes, null, styleIds, specializationIds, searchText);

            if (joins.Any())
                sql += " " + string.Join(" ", joins);

            if (whereClauses.Any())
                sql += " WHERE " + string.Join(" AND ", whereClauses);

            sql += " ORDER BY t.Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query(sql, parameters);
            }
        }

        /// <summary>
        /// Gets distinct styles that have cars matching the current filter criteria.
        /// </summary>
        public static IEnumerable<dynamic> GetAvailableStyles(
            IEnumerable<string> countryCodes = null,
            IEnumerable<int> makeIds = null,
            IEnumerable<int> years = null,
            IEnumerable<string> classes = null,
            IEnumerable<int> typeIds = null,
            IEnumerable<int> specializationIds = null,
            string searchText = null)
        {
            var sql = "SELECT DISTINCT s.Id, s.Name FROM CarStyling s INNER JOIN Cars_Styling cs ON s.Id = cs.StylingId INNER JOIN Cars c ON cs.CarId = c.Id";
            var parameters = new DynamicParameters();
            var whereClauses = new List<string>();
            var joins = new List<string>();

            BuildFilterJoinsAndWhere(ref joins, ref whereClauses, ref parameters, 
                countryCodes, makeIds, years, classes, typeIds, null, specializationIds, searchText);

            if (joins.Any())
                sql += " " + string.Join(" ", joins);

            if (whereClauses.Any())
                sql += " WHERE " + string.Join(" AND ", whereClauses);

            sql += " ORDER BY s.Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query(sql, parameters);
            }
        }

        /// <summary>
        /// Gets distinct specializations that have cars matching the current filter criteria.
        /// </summary>
        public static IEnumerable<dynamic> GetAvailableSpecializations(
            IEnumerable<string> countryCodes = null,
            IEnumerable<int> makeIds = null,
            IEnumerable<int> years = null,
            IEnumerable<string> classes = null,
            IEnumerable<int> typeIds = null,
            IEnumerable<int> styleIds = null,
            string searchText = null)
        {
            var sql = "SELECT DISTINCT sp.Id, sp.Name FROM RacingSpecializations sp INNER JOIN Cars_Specializations csp ON sp.Id = csp.SpecializationId INNER JOIN Cars c ON csp.CarId = c.Id";
            var parameters = new DynamicParameters();
            var whereClauses = new List<string>();
            var joins = new List<string>();

            BuildFilterJoinsAndWhere(ref joins, ref whereClauses, ref parameters, 
                countryCodes, makeIds, years, classes, typeIds, styleIds, null, searchText);

            if (joins.Any())
                sql += " " + string.Join(" ", joins);

            if (whereClauses.Any())
                sql += " WHERE " + string.Join(" AND ", whereClauses);

            sql += " ORDER BY sp.Name";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query(sql, parameters);
            }
        }

        /// <summary>
        /// Helper method to build JOIN and WHERE clauses for filter queries.
        /// </summary>
        private static void BuildFilterJoinsAndWhere(
            ref List<string> joins,
            ref List<string> whereClauses,
            ref DynamicParameters parameters,
            IEnumerable<string> countryCodes = null,
            IEnumerable<int> makeIds = null,
            IEnumerable<int> years = null,
            IEnumerable<string> classes = null,
            IEnumerable<int> typeIds = null,
            IEnumerable<int> styleIds = null,
            IEnumerable<int> specializationIds = null,
            string searchText = null)
        {
            // Type filter (requires join to Cars_Types) - only if not already in main query
            if (typeIds != null && typeIds.Any())
            {
                joins.Add("INNER JOIN Cars_Types ct2 ON c.Id = ct2.CarId");
                whereClauses.Add("ct2.TypeId IN @TypeIds");
                parameters.Add("TypeIds", typeIds.ToList());
            }

            // Style filter (requires join to Cars_Styling) - only if not already in main query
            if (styleIds != null && styleIds.Any())
            {
                joins.Add("INNER JOIN Cars_Styling cs2 ON c.Id = cs2.CarId");
                whereClauses.Add("cs2.StylingId IN @StyleIds");
                parameters.Add("StyleIds", styleIds.ToList());
            }

            // Specialization filter (requires join to Cars_Specializations) - only if not already in main query
            if (specializationIds != null && specializationIds.Any())
            {
                joins.Add("INNER JOIN Cars_Specializations csp2 ON c.Id = csp2.CarId");
                whereClauses.Add("csp2.SpecializationId IN @SpecializationIds");
                parameters.Add("SpecializationIds", specializationIds.ToList());
            }

            // Country filter
            if (countryCodes != null && countryCodes.Any())
            {
                whereClauses.Add("c.Country IN @CountryCodes");
                parameters.Add("CountryCodes", countryCodes.ToList());
            }

            // Manufacturer filter
            if (makeIds != null && makeIds.Any())
            {
                whereClauses.Add("c.MakeId IN @MakeIds");
                parameters.Add("MakeIds", makeIds.ToList());
            }

            // Year filter
            if (years != null && years.Any())
            {
                whereClauses.Add("c.Year IN @Years");
                parameters.Add("Years", years.ToList());
            }

            // Class filter
            if (classes != null && classes.Any())
            {
                whereClauses.Add("c.Class IN @Classes");
                parameters.Add("Classes", classes.ToList());
            }

            // Text search filter
            if (!string.IsNullOrWhiteSpace(searchText))
            {
                whereClauses.Add("c.Name LIKE @SearchText");
                parameters.Add("SearchText", $"%{searchText}%");
            }

            // Always exclude cars with null/invalid name or year
            whereClauses.Add("c.Name IS NOT NULL");
            whereClauses.Add("c.Year IS NOT NULL");
            whereClauses.Add("c.Year > 0");
        }
    }
}
