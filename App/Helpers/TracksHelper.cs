using System.Text.Json;
using RacerUI.Entities;
using RacerUI.Models;

namespace RacerUI.Helpers
{
    public static class TracksHelper
    {
        public static async Task GetTrackDetailsFromAI(Track track)
        {
            // Check if track has already been processed by AI (version index 0 should be '0' if not processed)
            if (VersionHelper.GetVersion(track.Version, 0) != '0') return;

            // Build track info string for AI
            var trackInfo = $@"
Track Path: {track.Path}
Track Name: {track.Name}
SubPath: {track.SubPath ?? "None"}
Country: {track.Country ?? "Unknown"}
City: {track.City ?? "Unknown"}
Year: {track.Year?.ToString() ?? "Unknown"}
Length: {track.Length?.ToString() ?? "Unknown"} meters
Width: {track.Width?.ToString() ?? "Unknown"} meters
Pit Boxes: {track.PitBoxes?.ToString() ?? "Unknown"}
Author: {track.Author ?? "Unknown"}
";

            var systemPrompt =
                @$"
You are a racing simulator expert that can provide detailed information about track mods for Assetto Corsa. 
The user will provide information about a specific track mod that they have, and you will generate all
factual data that you know about the track mod, and if the track mod is associated with a real racing circuit,
you must provide all the data you have about the real track as well.

#Definitions#
Name: official track name. Don't include the city name in the track name unless the real-world official name contains the city name within it. Make sure to clean up the name since this is being used in a video game, so no leading or trailing underscores, and no periods or dashes between words unless they are part of the official track name
Country: The country where the track is located, as a 2 character country code in all caps
City: The city or region where the track is located
Year: The year the track was built or first opened. If the track has been rebuilt or significantly modified, use the original opening year.
Length: The length of the track in meters (integer value). If multiple layouts exist, use the main/longest layout length.
Width: The average width of the track in meters (integer value). If not known, estimate based on track type.
PitBoxes: The number of pit boxes or garage spaces available at the track (integer value)
Author: The person or team that developed the track mod
Type: The type of track selected from the available list below
Available Types: {string.Join(", ", App.TrackTypes.Select(a => a.Name))}
Details: All biographical and historical details you have about the track itself, including:
  - When it was built and by whom
  - Major racing events held at the track (F1, MotoGP, endurance races, etc.)
  - Famous races, moments, or records set at the track
  - Track characteristics (elevation changes, famous corners, technical sections)
  - Any significant modifications or changes to the layout over the years
  - Notable accidents or incidents
  - Current status (active, closed, renovated)
  - Any fun facts or interesting trivia about the track
  Don't mention that it is a mod for a game, but you can mention the unique features that this mod contains.

#Rules#
* Separate paragraphs in the details property using two line breaks ""\\n\\n"".
* Only use the provided ""Available Types"" for the type field and don't use anything else.
* If you cannot determine a value with confidence, leave it as null or empty string.
* Focus on factual, verifiable information about real racing circuits.
* For fictional or fantasy tracks, provide details about the mod itself and its characteristics.

#Output#
You will output a JSON object (without comments) and nothing before or after the JSON object. Use the following template to output with:
{{
    ""name"": """",
    ""country"": """",
    ""city"": """",
    ""year"": null,
    ""length"": null,
    ""width"": null,
    ""pitBoxes"": null,
    ""author"": """",
    ""type"": """",
    ""details"": """"
}};";

            //send prompt to preferred LLM
            AI_TrackDetails trackDetails = null;
            try
            {
                var response = await LLMs.Prompt(systemPrompt, "", trackInfo);
                trackDetails = JsonSerializer.Deserialize<AI_TrackDetails>(response.Replace("json```", "").Replace("```json", "").Replace("```", ""));
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
                return;
            }

            if (trackDetails != null)
            {
                //update track details from AI response
                try
                {
                    if (!string.IsNullOrEmpty(trackDetails.Name) && 
                    (
                        string.IsNullOrEmpty(trackDetails.City) || 
                        (
                            !string.IsNullOrEmpty(trackDetails.City) && trackDetails.Name != trackDetails.City
                        )
                    ))
                    {
                        track.Name = trackDetails.Name;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Error: " + ex.Message);
                }

                if (!track.Year.HasValue || track.Year == 0)
                {
                    try
                    {
                        if (trackDetails.Year.HasValue && trackDetails.Year > 0)
                        {
                            track.Year = trackDetails.Year;
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                
                if (string.IsNullOrEmpty(track.Country))
                {
                    try
                    {
                        track.Country = CountriesHelper.GetCountryCode(!string.IsNullOrEmpty(trackDetails.Country) && trackDetails.Country.Length > 2
                            ? trackDetails.Country.Substring(0, 2)
                            : trackDetails.Country);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }

                try
                {
                    if (!string.IsNullOrEmpty(trackDetails.City))
                    {
                        track.City = trackDetails.City;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Error: " + ex.Message);
                }

                if (!track.Length.HasValue || track.Length == 0)
                {
                    try
                    {
                        if (trackDetails.Length.HasValue && trackDetails.Length > 0)
                        {
                            track.Length = trackDetails.Length;
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                
                if (!track.Width.HasValue || track.Width == 0)
                {
                    try
                    {
                        if (trackDetails.Width.HasValue && trackDetails.Width > 0)
                        {
                            track.Width = trackDetails.Width;
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                
                if (!track.PitBoxes.HasValue || track.PitBoxes == 0)
                {
                    try
                    {
                        if (trackDetails.PitBoxes.HasValue && trackDetails.PitBoxes > 0)
                        {
                            track.PitBoxes = trackDetails.PitBoxes;
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                
                if (string.IsNullOrEmpty(track.Author))
                {
                    try
                    {
                        if (!string.IsNullOrEmpty(trackDetails.Author))
                        {
                            track.Author = trackDetails.Author;
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                try
                {
                    if (!string.IsNullOrEmpty(trackDetails.Details))
                    {
                        track.Details = trackDetails.Details;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Error: " + ex.Message);
                }

                if (!track.TypeId.HasValue || track.TypeId == 0)
                {
                    try
                    {
                        if (!string.IsNullOrEmpty(trackDetails.Type))
                        {
                            // Try loose matching - check if AI type contains any database type or vice versa
                            var trackType = App.TrackTypes.FirstOrDefault(t => 
                                t.Name.Contains(trackDetails.Type, StringComparison.OrdinalIgnoreCase) ||
                                trackDetails.Type.Contains(t.Name, StringComparison.OrdinalIgnoreCase));
                            
                            if (trackType != null)
                            {
                                track.TypeId = trackType.Id;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                
                // Mark track as processed by AI (set version index 0 to '1')
                track.Version = VersionHelper.SetVersion(track.Version, 0, '1');
            }
        }
    }
}
