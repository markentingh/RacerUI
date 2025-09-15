using Microsoft.Data.Sqlite;

namespace RacerUI.SQL
{
    public static class Connection
    {
        public static string DatabasePath;

        private static SqliteConnection? _connection;
        private static bool connecting { get; set; } = false;

        public static void Load(string? databasePath = null)
        {
            if (connecting) return;
            connecting = true;
            DatabasePath = databasePath ?? Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "RacerUI.sqlite");
            if(File.Exists(DatabasePath))
            {
                _connection = new SqliteConnection($"Data Source={DatabasePath}");
                _connection.Open();
                connecting = false;
            }
            else
            {
                connecting = false;
                throw new Exception("Database file not found in " + DatabasePath);
            }
        }

        public static SqliteConnection GetConnection()
        {
            if (_connection == null) Load();
            return _connection!;
        }

        public static void Close()
        {
            _connection!.Close();
            _connection!.Dispose();
            _connection = null;
        }
    }
}
