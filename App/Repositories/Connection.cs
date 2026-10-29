using Microsoft.Data.Sqlite;

namespace RacerUI.SQL
{
    public static class Connection
    {
        public static string? DatabasePath;
        private static string? _connectionString;
        private static bool connecting { get; set; } = false;

        public static void Load(string? databasePath = null)
        {
            if (connecting) return;
            if (_connectionString != null) return;
            connecting = true;
            DatabasePath = databasePath ?? Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "RacerUI.sqlite");
            if (File.Exists(DatabasePath))
            {
                _connectionString = $"Data Source={DatabasePath};Default Timeout=30";
                connecting = false;
            }
            else
            {
                connecting = false;
                throw new Exception("Database file not found in " + DatabasePath);
            }
        }

        // Returns a NEW opened connection per call. SqliteConnection is not
        // thread-safe, so repositories must never share one - callers dispose
        // via `using`. Microsoft.Data.Sqlite pools connections by default,
        // so open/dispose is cheap.
        public static SqliteConnection GetConnection()
        {
            Load();
            var connection = new SqliteConnection(_connectionString);
            connection.Open();
            return connection;
        }
    }
}
