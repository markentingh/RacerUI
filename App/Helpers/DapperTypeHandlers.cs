using Dapper;
using System.Data;

namespace RacerUI.Helpers
{
    /// <summary>
    /// Custom Dapper type handler to convert Int64 to double for nullable double properties
    /// This is needed when the database column is INTEGER but the entity property is double?
    /// </summary>
    public class NullableDoubleHandler : SqlMapper.TypeHandler<double?>
    {
        public override double? Parse(object value)
        {
            if (value == null || value is DBNull)
                return null;

            // Handle Int64 (INTEGER in SQLite)
            if (value is long longValue)
                return (double)longValue;

            // Handle double
            if (value is double doubleValue)
                return doubleValue;

            // Try to convert string
            if (value is string stringValue && double.TryParse(stringValue, out var result))
                return result;

            return null;
        }

        public override void SetValue(IDbDataParameter parameter, double? value)
        {
            parameter.Value = value ?? (object)DBNull.Value;
        }
    }

    /// <summary>
    /// Initialize Dapper type handlers
    /// </summary>
    public static class DapperConfig
    {
        private static bool _initialized = false;

        public static void Initialize()
        {
            if (_initialized) return;

            SqlMapper.AddTypeHandler(new NullableDoubleHandler());

            _initialized = true;
        }
    }
}
