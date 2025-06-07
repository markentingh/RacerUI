using Microsoft.AspNetCore.SignalR;

namespace RacerUI.SignalR
{
    public class DashboardHub : Hub
    {
        public async Task handshake()
        {
            await Clients.Caller.SendAsync("update", "Connected to RacerUI server v0.1.0");
        }

        public async Task AddGameToLibrary(string game, string path)
        {
            await Clients.Caller.SendAsync("update", "Adding " + game + " to the library");
        }
    }
}
