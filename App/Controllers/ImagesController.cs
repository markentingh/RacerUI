using Microsoft.AspNetCore.Mvc;
using System.IO;

namespace RacerUI.Controllers
{
    [Route("image")]
    public class ImagesController : BaseController
    {
        [HttpGet("{*path}")]
        public IActionResult GetImage(string path)
        {
            if (string.IsNullOrEmpty(path))
            {
                return NotFound();
            }

            string imagePath = "";
            
            // Handle Assetto Corsa skin previews
            if (path.StartsWith("assetto corsa/skin/"))
            {
                var pathParts = path.Split('/');
                if (pathParts.Length < 4)
                {
                    return NotFound();
                }

                var game = App.Game("assetto corsa");
                if (game == null || string.IsNullOrEmpty(game.GamePath))
                {
                    return NotFound("Game not found or Steam folder not configured");
                }

                string carFolderName = pathParts[2];
                string skinFolderName = pathParts[3];
                
                // Build the path to the preview.jpg file
                imagePath = Path.Combine(
                    game.GamePath,
                    "content",
                    "cars",
                    carFolderName,
                    "skins",
                    skinFolderName,
                    "preview.jpg"
                );
                if (!System.IO.File.Exists(imagePath))
                {
                    imagePath = Path.Combine(
                        game.GamePath,
                        "content",
                        "cars",
                        carFolderName,
                        "skins",
                        skinFolderName,
                        "preview.png"
                    );
                }
            }
            // Handle Assetto Corsa track maps
            else if (path.StartsWith("assetto corsa/track/"))
            {
                var pathParts = path.Split('/');
                if (pathParts.Length < 3)
                {
                    return NotFound();
                }

                var game = App.Game("assetto corsa");
                if (game == null || string.IsNullOrEmpty(game.GamePath))
                {
                    return NotFound("Game not found or Steam folder not configured");
                }

                string trackFolderName = pathParts[2];
                string subPath = pathParts.Length >= 4 ? pathParts[3] : null;
                
                // Build the path to the preview.png file
                if (!string.IsNullOrEmpty(subPath))
                {
                    // Track has a subfolder (multi-layout track)
                    imagePath = Path.Combine(
                        game.GamePath,
                        "content",
                        "tracks",
                        trackFolderName,
                        "ui",
                        subPath,
                        "preview.png"
                    );
                    if (!System.IO.File.Exists(imagePath))
                    {
                        imagePath = Path.Combine(
                            game.GamePath,
                            "content",
                            "tracks",
                            trackFolderName,
                            "ui",
                            subPath,
                            "preview.jpg"
                        );
                    }
                }
                else
                {
                    // Track is directly in ui folder (single layout)
                    imagePath = Path.Combine(
                        game.GamePath,
                        "content",
                        "tracks",
                        trackFolderName,
                        "ui",
                        "preview.png"
                    );
                    if (!System.IO.File.Exists(imagePath))
                    {
                        imagePath = Path.Combine(
                            game.GamePath,
                            "content",
                            "tracks",
                            trackFolderName,
                            "ui",
                            "preview.jpg"
                        );
                    }
                }
            }
            else
            {
                return NotFound("Unsupported image path");
            }

            // Check if the file exists
            if (!System.IO.File.Exists(imagePath))
            {
                return NotFound($"Image not found: {imagePath}");
            }

            // Return the image file
            var imageBytes = System.IO.File.ReadAllBytes(imagePath);
            return File(imageBytes, "image/jpeg");
        }
    }
}
