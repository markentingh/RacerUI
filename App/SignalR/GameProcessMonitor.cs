using Microsoft.AspNetCore.SignalR;

namespace RacerUI.SignalR
{
    /// <summary>
    /// Watches for the Assetto Corsa executable (acs.exe) the same way ACTools'
    /// process watcher does: tracks the Process object we launched directly and
    /// polls the system process list on a timer, broadcasting state changes to
    /// all connected dashboard clients - so the UI reflects the game running
    /// even when it was launched outside RacerUI.
    /// </summary>
    public static class GameProcessMonitor
    {
        private static readonly object _lock = new object();
        private static IHubContext<DashboardHub> _hub;
        private static Timer _timer;
        private static System.Diagnostics.Process _launched;
        private static bool _isRunning;

        public static bool IsRunning => _isRunning;

        /// <summary>Starts the polling watcher once. Called when the hub first spins up.</summary>
        public static void Start(IHubContext<DashboardHub> hub)
        {
            lock (_lock)
            {
                if (_timer != null) return;
                _hub = hub;
                _isRunning = CheckRunning();
                _timer = new Timer(Poll, null, TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(2));
                Console.WriteLine($"[GameProcessMonitor] Started (acs.exe running: {_isRunning})");
            }
        }

        /// <summary>Called by RunGame with the Process it started - the most
        /// reliable running signal for our own launches</summary>
        public static void NotifyLaunched(System.Diagnostics.Process process)
        {
            _launched = process;
            SetRunning(true);
        }

        private static void Poll(object state)
        {
            try
            {
                SetRunning(CheckRunning());
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GameProcessMonitor poll failed: {ex.Message}");
            }
        }

        private static void SetRunning(bool running)
        {
            if (running == _isRunning) return;

            _isRunning = running;
            Console.WriteLine($"[GameProcessMonitor] acs.exe running: {running}");
            try
            {
                _hub?.Clients.All.SendAsync("gameState", running);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GameProcessMonitor broadcast failed: {ex.Message}");
            }
        }

        private static bool CheckRunning()
        {
            // Fast path: the process we launched is still alive
            try
            {
                if (_launched != null)
                {
                    if (!_launched.HasExited) return true;
                    _launched = null;
                }
            }
            catch
            {
                _launched = null;
            }

            var gameExe = GetGameExePath();
            foreach (var process in System.Diagnostics.Process.GetProcessesByName("acs"))
            {
                using (process)
                {
                    // If the AC install path is unknown, any acs.exe counts as running
                    if (string.IsNullOrEmpty(gameExe))
                    {
                        return true;
                    }

                    try
                    {
                        if (string.Equals(process.MainModule?.FileName, gameExe, StringComparison.OrdinalIgnoreCase))
                        {
                            return true;
                        }
                    }
                    catch
                    {
                        // MainModule access can fail (bitness/permissions) - the
                        // process name alone is distinctive enough to count it
                        return true;
                    }
                }
            }
            return false;
        }

        private static string GetGameExePath()
        {
            try
            {
                var game = SQL.GamesRepository.GetByName("assetto corsa");
                return string.IsNullOrEmpty(game?.Path) ? null : Path.Combine(game.Path, "acs.exe");
            }
            catch
            {
                return null;
            }
        }
    }
}
