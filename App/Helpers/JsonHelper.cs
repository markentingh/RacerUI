using System.Text.RegularExpressions;
using System.Text.Json;
using System.Text.Json.Serialization;


namespace RacerUI.Helpers
{
    public static class JsonHelper
    {
        /// <summary>
        /// Parses a JSON string and re-serializes it, wrapping unquoted values in double quotes.
        /// This is useful for handling non-standard JSON, such as integers with leading zeros.
        /// </summary>
        /// <param name="rawJson">The raw JSON string to sanitize.</param>
        /// <returns>A sanitized JSON string with all property values enclosed in double quotes.</returns>
        public static string CleanRawJson(string rawJson)
        {
            try
            {
                var json = Regex.Replace(rawJson, @"(""[^""]*"")\s*:\s*([a-zA-Z0-9_]+)([\,\s\}\r\n]+)", "$1: \"$2\"$3")
                    .Replace("\t","").Replace("\r", "").Replace("\n", "");
                //fix properties that don't even have a value
                json = Regex.Replace(json, @"(""[^""]*"")\s*:\s*(\,)([,\s\}])", "$1: \"\"$2$3");
                return json;
            }
            catch (Exception ex)
            {
                // If there's an error, fall back to the original JSON
                Console.WriteLine($"Error in QuoteAllValues: {ex.Message}");
                return rawJson;
            }
        }

        public class NumberToStringConverter : JsonConverter<string>
        {
            public override string Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            {
                switch (reader.TokenType)
                {
                    case JsonTokenType.Number:
                        // For numbers, convert to string with special handling for small values
                        if (reader.TryGetInt64(out long longValue))
                        {
                            // Add leading zero for single-digit numbers
                            if (longValue >= 0 && longValue < 10)
                            {
                                return "0" + longValue.ToString();
                            }
                            return longValue.ToString();
                        }
                        else if (reader.TryGetDouble(out double doubleValue))
                        {
                            return doubleValue.ToString();
                        }
                        break;
                    case JsonTokenType.String:
                        return reader.GetString();
                    case JsonTokenType.True:
                        return "true";
                    case JsonTokenType.False:
                        return "false";
                    case JsonTokenType.Null:
                        return null;
                }
                
                throw new JsonException($"Cannot convert {reader.TokenType} to string");
            }

            public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
            {
                // When serializing, write the string value directly.
                writer.WriteStringValue(value);
            }
        }
    }
}
