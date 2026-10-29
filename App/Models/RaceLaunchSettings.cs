using System.Collections.Generic;

namespace RacerUI.Models
{
    /// <summary>
    /// Extra launch settings collected from the footer's race-settings panel
    /// (weather system, wind, track state). Deserialized from the settingsJson
    /// argument passed to DashboardHub.PlayGame.
    /// </summary>
    public class RaceLaunchSettings
    {
        /// <summary>ACTools WeatherType enum value for a static weather, 15 (Clear) for
        /// controller-driven dynamic weather, or null to not override.</summary>
        public int? WeatherType { get; set; }

        /// <summary>CSP weather controller folder id (extension/weather-controllers/&lt;id&gt;).</summary>
        public string WeatherController { get; set; }

        /// <summary>Dynamic controller settings grouped by ini section, published to
        /// cfg/extension/state/lua/wfx_controller/&lt;id&gt;__settings.ini</summary>
        public Dictionary<string, Dictionary<string, string>> ControllerSettings { get; set; }

        public double? WindSpeedKmh { get; set; }
        public int? WindDirectionDeg { get; set; }

        /// <summary>Track condition preset index: -1/null = Auto, 0-5 = Dusty..Optimum.</summary>
        public int? TrackPreset { get; set; }
    }
}
