using Microsoft.AspNetCore.Mvc;
using RacerUI.Entities;
using RacerUI.SQL;
using System.Text.Json.Serialization;

namespace RacerUI.Controllers
{
    [Route("api/favorites")]
    public class FavoritesController : BaseController
    {
        public class SaveFavoriteRequest
        {
            public string Title { get; set; }
            public string ConfigJson { get; set; }
            public int? CarId { get; set; }
            public string Skin { get; set; }
            public int? TrackId { get; set; }
        }

        /// <summary>
        /// Lists saved favorites, newest first, paged for infinite scrolling
        /// </summary>
        [HttpGet]
        public IActionResult GetAll([FromQuery] int start = 0, [FromQuery] int length = 50)
        {
            var result = new
            {
                Total = FavoritesRepository.GetCount(),
                Favorites = FavoritesRepository.GetAll(start, length)
            };
            return Ok(result);
        }

        /// <summary>
        /// Saves a racing configuration as a favorite. CarSkinId is resolved
        /// from the skin folder path/name when the client sends one.
        /// </summary>
        [HttpPost]
        public IActionResult Save([FromBody] SaveFavoriteRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest("A configuration name is required");
            }

            int? skinId = null;
            if (request.CarId != null && !string.IsNullOrEmpty(request.Skin))
            {
                skinId = FavoritesRepository.GetSkinId(request.CarId.Value, request.Skin);
            }

            var favorite = new Favorite
            {
                Title = request.Title.Trim(),
                ConfigJson = request.ConfigJson ?? "{}",
                CarId = request.CarId,
                CarSkinId = skinId,
                TrackId = request.TrackId,
                Created = DateTime.UtcNow.ToString("o")
            };

            favorite.Id = FavoritesRepository.Add(favorite);
            return Ok(favorite);
        }

        /// <summary>
        /// Deletes a favorite by id
        /// </summary>
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            return FavoritesRepository.Delete(id) ? Ok() : NotFound();
        }
    }
}
