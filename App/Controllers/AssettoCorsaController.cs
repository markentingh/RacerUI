using Microsoft.AspNetCore.Mvc;
using RacerUI.Helpers;

namespace RacerUI.Controllers
{
    [Route("api/ac")]
    public class AssettoCorsaController : BaseController
    {
        /// <summary>
        /// Lists CSP weather controllers found in extension/weather-controllers
        /// (folders containing controller.lua + manifest.ini)
        /// </summary>
        [HttpGet("weather-controllers")]
        public IActionResult GetWeatherControllers()
        {
            var game = App.Game("assetto corsa");
            if (game == null || string.IsNullOrEmpty(game.GamePath))
            {
                return NotFound("Game not found or Steam folder not configured");
            }

            return Ok(AssettoCorsaHelper.GetWeatherControllers(game.GamePath));
        }

        /// <summary>
        /// Parses a controller's settings.ini into UI field descriptors
        /// (checkboxes, dropdowns, numbers, text inputs)
        /// </summary>
        [HttpGet("weather-controllers/{id}/settings")]
        public IActionResult GetControllerSettings(string id)
        {
            var game = App.Game("assetto corsa");
            if (game == null || string.IsNullOrEmpty(game.GamePath))
            {
                return NotFound("Game not found or Steam folder not configured");
            }

            return Ok(AssettoCorsaHelper.GetControllerSettingsFields(game.GamePath, id));
        }
    }
}
