using Microsoft.Win32;
using System.IO;

namespace RacerUI.Helpers {
    public static class GameHelper {
        public static string GetGameFromPath(string path) {
            // Normalize path to use OS-specific separators
            path = Path.GetFullPath(path);
            
            // Convert to lowercase for case-insensitive comparison
            string normalizedPath = path.ToLowerInvariant();
            
            if(normalizedPath.Contains("assettocorsa")){
                return "assetto corsa";
            }
            return "";
        }
    }
}