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

        /// <summary>Quick-drive mode from the footer's Race tab:
        /// practice | hotlap | race | trackday | weekend | drift | timeattack | drag.
        /// Null keeps the legacy positional session parameters.</summary>
        public string Mode { get; set; }

        public bool? Penalties { get; set; }

        /// <summary>ACTools JumpStartPenaltyType: 0 = none, 1 = pits, 2 = drive-through.</summary>
        public int? JumpStartPenalty { get; set; }

        /// <summary>PIT | START | HOTLAP_START - spawn set for practice/drift sessions.</summary>
        public string StartType { get; set; }

        /// <summary>Player ballast in kg, written to [CAR_0] BALLAST.</summary>
        public double? BallastKg { get; set; }

        /// <summary>Player restrictor in %, written to [CAR_0] RESTRICTOR.</summary>
        public double? RestrictorPct { get; set; }

        // Hotlap ghost car
        public bool? GhostCar { get; set; }
        public bool? RecordGhostCar { get; set; }

        /// <summary>Ghost car advantage in seconds ([GHOST_CAR] SECONDS_ADVANTAGE).</summary>
        public double? GhostCarAdvantage { get; set; }

        // AI grid (race/trackday/weekend; drag always adds exactly one bot)
        public int? Opponents { get; set; }
        public int? AiLevel { get; set; }
        public int? AiAggression { get; set; }
        public int? StartingPosition { get; set; }
        public int? RaceLaps { get; set; }

        /// <summary>Track day opponent speed limit in km/h ([SESSION_0] __SPEED_LIMIT).</summary>
        public double? SpeedLimitKmh { get; set; }

        // Weekend session lengths in minutes (a session is skipped at 0)
        public int? PracticeDurationMinutes { get; set; }
        public int? QualificationDurationMinutes { get; set; }

        /// <summary>Drag mode number of matches ([SESSION_0] MATCHES).</summary>
        public int? MatchesCount { get; set; }

        /// <summary>Opponent car pool (ACTools' candidate list). Bots are filled
        /// from these entries, cycling when there are more opponents than
        /// candidates. Empty/null falls back to the player's car.</summary>
        public List<LaunchCandidate> Candidates { get; set; }
    }

    public class LaunchCandidate
    {
        /// <summary>Car folder name ([CAR_n] MODEL).</summary>
        public string CarPath { get; set; }

        /// <summary>Skin folder/file name ([CAR_n] SKIN); null uses the player's skin.</summary>
        public string SkinPath { get; set; }
    }
}
