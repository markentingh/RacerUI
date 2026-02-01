using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Security.Cryptography;
using System.Text;

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
            // Handle Assetto Corsa track outlines
            else if (path.StartsWith("assetto corsa/track-outline/"))
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
                
                // Build the path to the outline.png file
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
                        "outline.png"
                    );
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
                        "outline.png"
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

            // Get file info for caching
            var fileInfo = new FileInfo(imagePath);
            var lastModified = fileInfo.LastWriteTimeUtc;
            
            // Generate ETag based on file path and last modified time
            var etagValue = GenerateETag(imagePath, lastModified);
            var etag = new Microsoft.Net.Http.Headers.EntityTagHeaderValue($"\"{etagValue}\"");
            
            // Check if client has cached version
            var requestHeaders = Request.GetTypedHeaders();
            
            // Check If-None-Match (ETag)
            if (requestHeaders.IfNoneMatch != null && requestHeaders.IfNoneMatch.Any())
            {
                if (requestHeaders.IfNoneMatch.Any(e => e.Tag == etag.Tag))
                {
                    return StatusCode(304); // Not Modified
                }
            }
            
            // Check If-Modified-Since
            if (requestHeaders.IfModifiedSince.HasValue)
            {
                if (lastModified <= requestHeaders.IfModifiedSince.Value)
                {
                    return StatusCode(304); // Not Modified
                }
            }

            // Read and return the image file with caching headers
            var imageBytes = System.IO.File.ReadAllBytes(imagePath);
            var contentType = imagePath.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ? "image/png" : "image/jpeg";
            
            Response.GetTypedHeaders().CacheControl = new Microsoft.Net.Http.Headers.CacheControlHeaderValue
            {
                Public = true,
                MaxAge = TimeSpan.FromDays(30)
            };
            Response.GetTypedHeaders().ETag = etag;
            Response.GetTypedHeaders().LastModified = lastModified;
            
            return File(imageBytes, contentType);
        }
        
        private string GenerateETag(string filePath, DateTime lastModified)
        {
            var input = $"{filePath}:{lastModified.Ticks}";
            using (var md5 = MD5.Create())
            {
                var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(input));
                return Convert.ToBase64String(hash);
            }
        }
    }
}
