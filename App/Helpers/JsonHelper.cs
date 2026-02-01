using System.Text.RegularExpressions;
using System.Text.Json;
using System.Text.Json.Serialization;


namespace RacerUI.Helpers
{
    public static class JsonHelper
    {
        /// <summary>
        /// Repairs common JSON syntax errors in malformed JSON strings
        /// </summary>
        public static string RepairMalformedJson(string json)
        {
            if (string.IsNullOrEmpty(json))
            {
                return json;
            }

            // Remove ": " from the beginning of property values
            // Pattern: "property": ": value" becomes "property": "value"
            var fixedJson = Regex.Replace(
                json,
                @":\s*([""']):\s+",
                ": $1",
                RegexOptions.Multiline
            );

            // Remove invalid characters after string values (before comma, }, or ])
            // Pattern: "value" followed by invalid characters before comma/brace/bracket
            // Example: "value"R "next" becomes "value","next"
            fixedJson = Regex.Replace(
                fixedJson,
                @"([""'])\s*([A-Za-z]+)\s*([,\}\]])",
                "$1$3",
                RegexOptions.Multiline
            );

            // Remove invalid characters after numbers (before comma, }, or ])
            // Pattern: number followed by invalid characters before comma/brace/bracket
            fixedJson = Regex.Replace(
                fixedJson,
                @"(\d+)\s*([A-Za-z]+)\s*([,\}\]])",
                "$1$3",
                RegexOptions.Multiline
            );

            // Remove invalid characters after closing braces/brackets
            // Pattern: } or ] followed by invalid characters before comma/brace/bracket
            fixedJson = Regex.Replace(
                fixedJson,
                @"([\}\]])\s*([A-Za-z]+)\s*([,\}\]])",
                "$1$3",
                RegexOptions.Multiline
            );

            // Fix missing commas between properties
            // Pattern: "value" followed by whitespace and then a quote (start of next property)
            // This handles cases like: "property": "value" "nextProperty": "value"
            fixedJson = Regex.Replace(
                fixedJson,
                @"([""'])\s*\n?\s*([""'][^""':,\{\}\[\]]+[""']\s*:)",
                "$1,$2",
                RegexOptions.Multiline
            );

            // Fix missing commas after closing braces/brackets before quotes
            // Pattern: } or ] followed by whitespace and then a quote
            fixedJson = Regex.Replace(
                fixedJson,
                @"([\}\]])\s*\n?\s*([""'])",
                "$1,$2",
                RegexOptions.Multiline
            );

            // Fix missing commas after numbers/booleans before quotes
            // Pattern: number or boolean followed by whitespace and then a quote
            fixedJson = Regex.Replace(
                fixedJson,
                @"(\d+|true|false|null)\s*\n?\s*([""'][^""':,\{\}\[\]]+[""']\s*:)",
                "$1,$2",
                RegexOptions.Multiline
            );

            return fixedJson;
        }

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

        /// <summary>
        /// Custom JSON converter that accepts both string and number values for string properties
        /// </summary>
        public class FlexibleStringConverter : JsonConverter<string>
        {
            public override string Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            {
                if (reader.TokenType == JsonTokenType.String)
                {
                    return reader.GetString();
                }
                else if (reader.TokenType == JsonTokenType.Number)
                {
                    // Handle numeric values by converting to string
                    if (reader.TryGetInt32(out var intValue))
                    {
                        return intValue.ToString();
                    }
                    else if (reader.TryGetDouble(out var doubleValue))
                    {
                        return doubleValue.ToString();
                    }
                }
                else if (reader.TokenType == JsonTokenType.True || reader.TokenType == JsonTokenType.False)
                {
                    return reader.GetBoolean().ToString();
                }
                else if (reader.TokenType == JsonTokenType.Null)
                {
                    return null;
                }
                
                return null;
            }

            public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
            {
                writer.WriteStringValue(value);
            }
        }

        /// <summary>
        /// Custom JSON converter that accepts both string and number values for int? properties
        /// </summary>
        public class FlexibleIntConverter : JsonConverter<int?>
        {
            public override int? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            {
                if (reader.TokenType == JsonTokenType.Number)
                {
                    if (reader.TryGetInt32(out var intValue))
                    {
                        return intValue;
                    }
                }
                else if (reader.TokenType == JsonTokenType.String)
                {
                    var stringValue = reader.GetString();
                    if (int.TryParse(stringValue, out var intValue))
                    {
                        return intValue;
                    }
                }
                else if (reader.TokenType == JsonTokenType.Null)
                {
                    return null;
                }
                
                return null;
            }

            public override void Write(Utf8JsonWriter writer, int? value, JsonSerializerOptions options)
            {
                if (value.HasValue)
                {
                    writer.WriteNumberValue(value.Value);
                }
                else
                {
                    writer.WriteNullValue();
                }
            }
        }
    }
}
