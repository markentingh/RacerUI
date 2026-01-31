namespace RacerUI.Helpers
{
    public static class CountriesHelper
    {
        // Complete list of all valid ISO 3166-1 alpha-2 country codes
        private static readonly HashSet<string> _validCountryCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
            "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ",
            "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ",
            "DE", "DJ", "DK", "DM", "DO", "DZ",
            "EC", "EE", "EG", "EH", "ER", "ES", "ET",
            "FI", "FJ", "FK", "FM", "FO", "FR",
            "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY",
            "HK", "HM", "HN", "HR", "HT", "HU",
            "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
            "JE", "JM", "JO", "JP",
            "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ",
            "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY",
            "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ",
            "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ",
            "OM",
            "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY",
            "QA",
            "RE", "RO", "RS", "RU", "RW",
            "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ",
            "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ",
            "UA", "UG", "UM", "US", "UY", "UZ",
            "VA", "VC", "VE", "VG", "VI", "VN", "VU",
            "WF", "WS",
            "YE", "YT",
            "ZA", "ZM", "ZW"
        };

        private static readonly Dictionary<string, string> _countryMappings = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            // Country names to codes
            { "afghanistan", "AF" },
            { "albania", "AL" },
            { "algeria", "DZ" },
            { "andorra", "AD" },
            { "angola", "AO" },
            { "argentina", "AR" },
            { "armenia", "AM" },
            { "australia", "AU" },
            { "austria", "AT" },
            { "azerbaijan", "AZ" },
            { "bahrain", "BH" },
            { "bangladesh", "BD" },
            { "belarus", "BY" },
            { "belgium", "BE" },
            { "bolivia", "BO" },
            { "bosnia and herzegovina", "BA" },
            { "brazil", "BR" },
            { "brunei", "BN" },
            { "bulgaria", "BG" },
            { "cambodia", "KH" },
            { "canada", "CA" },
            { "chile", "CL" },
            { "china", "CN" },
            { "colombia", "CO" },
            { "costa rica", "CR" },
            { "croatia", "HR" },
            { "cuba", "CU" },
            { "cyprus", "CY" },
            { "czech republic", "CZ" },
            { "czechoslovakia", "CZ" },
            { "denmark", "DK" },
            { "dominican republic", "DO" },
            { "ecuador", "EC" },
            { "egypt", "EG" },
            { "estonia", "EE" },
            { "ethiopia", "ET" },
            { "finland", "FI" },
            { "france", "FR" },
            { "georgia", "GE" },
            { "germany", "DE" },
            { "west germany", "DE" },
            { "east germany", "DE" },
            { "ghana", "GH" },
            { "greece", "GR" },
            { "guatemala", "GT" },
            { "honduras", "HN" },
            { "hong kong", "HK" },
            { "hungary", "HU" },
            { "iceland", "IS" },
            { "india", "IN" },
            { "indonesia", "ID" },
            { "iran", "IR" },
            { "iraq", "IQ" },
            { "ireland", "IE" },
            { "israel", "IL" },
            { "italy", "IT" },
            { "jamaica", "JM" },
            { "japan", "JP" },
            { "jordan", "JO" },
            { "kazakhstan", "KZ" },
            { "kenya", "KE" },
            { "kuwait", "KW" },
            { "latvia", "LV" },
            { "lebanon", "LB" },
            { "libya", "LY" },
            { "liechtenstein", "LI" },
            { "lithuania", "LT" },
            { "luxembourg", "LU" },
            { "malaysia", "MY" },
            { "malta", "MT" },
            { "mexico", "MX" },
            { "monaco", "MC" },
            { "mongolia", "MN" },
            { "morocco", "MA" },
            { "netherlands", "NL" },
            { "new zealand", "NZ" },
            { "nicaragua", "NI" },
            { "nigeria", "NG" },
            { "north korea", "KP" },
            { "norway", "NO" },
            { "oman", "OM" },
            { "pakistan", "PK" },
            { "panama", "PA" },
            { "paraguay", "PY" },
            { "peru", "PE" },
            { "philippines", "PH" },
            { "poland", "PL" },
            { "portugal", "PT" },
            { "puerto rico", "PR" },
            { "qatar", "QA" },
            { "romania", "RO" },
            { "russia", "RU" },
            { "soviet union", "RU" },
            { "ussr", "RU" },
            { "saudi arabia", "SA" },
            { "serbia", "RS" },
            { "singapore", "SG" },
            { "slovakia", "SK" },
            { "slovenia", "SI" },
            { "south africa", "ZA" },
            { "south korea", "KR" },
            { "spain", "ES" },
            { "sri lanka", "LK" },
            { "sweden", "SE" },
            { "switzerland", "CH" },
            { "syria", "SY" },
            { "taiwan", "TW" },
            { "thailand", "TH" },
            { "tunisia", "TN" },
            { "turkey", "TR" },
            { "ukraine", "UA" },
            { "united arab emirates", "AE" },
            { "uae", "AE" },
            { "united kingdom", "GB" },
            { "uk", "GB" },
            { "great britain", "GB" },
            { "britain", "GB" },
            { "england", "GB" },
            { "scotland", "GB" },
            { "wales", "GB" },
            { "northern ireland", "GB" },
            { "united states", "US" },
            { "usa", "US" },
            { "america", "US" },
            { "uruguay", "UY" },
            { "uzbekistan", "UZ" },
            { "venezuela", "VE" },
            { "vietnam", "VN" },
            { "yemen", "YE" },
            { "yugoslavia", "RS" },
            { "zimbabwe", "ZW" },
            
            // Language codes to country codes (common mappings)
            { "en", "GB" },
            { "en-us", "US" },
            { "en-gb", "GB" },
            { "en-au", "AU" },
            { "en-ca", "CA" },
            { "en-nz", "NZ" },
            { "fr", "FR" },
            { "fr-ca", "CA" },
            { "fr-be", "BE" },
            { "fr-ch", "CH" },
            { "de", "DE" },
            { "de-at", "AT" },
            { "de-ch", "CH" },
            { "es", "ES" },
            { "es-mx", "MX" },
            { "es-ar", "AR" },
            { "it", "IT" },
            { "it-ch", "CH" },
            { "pt", "PT" },
            { "pt-br", "BR" },
            { "nl", "NL" },
            { "nl-be", "BE" },
            { "pl", "PL" },
            { "ru", "RU" },
            { "ja", "JP" },
            { "zh", "CN" },
            { "zh-cn", "CN" },
            { "zh-tw", "TW" },
            { "zh-hk", "HK" },
            { "ko", "KR" },
            { "ar", "SA" },
            { "tr", "TR" },
            { "sv", "SE" },
            { "da", "DK" },
            { "no", "NO" },
            { "fi", "FI" },
            { "cs", "CZ" },
            { "hu", "HU" },
            { "ro", "RO" },
            { "el", "GR" },
            { "he", "IL" },
            { "th", "TH" },
            { "vi", "VN" },
            { "id", "ID" },
            { "ms", "MY" },
            { "bg", "BG" },
            { "hr", "HR" },
            { "sk", "SK" },
            { "sl", "SI" },
            { "et", "EE" },
            { "lv", "LV" },
            { "lt", "LT" }
        };

        /// <summary>
        /// Converts a language code or country name to a 2-character uppercase country code
        /// </summary>
        /// <param name="input">Language code (e.g., "en-us", "fr") or country name (e.g., "united states", "france")</param>
        /// <returns>2-character uppercase country code (e.g., "US", "FR") or the original input if no mapping found</returns>
        public static string GetCountryCode(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return string.Empty;

            var trimmed = input.Trim().ToLower();

            // Try to find mapping
            if (_countryMappings.TryGetValue(trimmed, out var countryCode))
                return countryCode;

            // If no mapping found and input is longer than 2 chars, truncate to 2 and uppercase
            if (trimmed.Length > 2)
                return trimmed.Substring(0, 2).ToUpper();

            return trimmed.ToUpper();
        }

        /// <summary>
        /// Gets the country name from a 2-character country code using .NET CultureInfo
        /// </summary>
        /// <param name="countryCode">2-character country code (e.g., "US", "FR", "GB")</param>
        /// <returns>Country name (e.g., "United States", "France", "United Kingdom") or empty string if not found</returns>
        public static string GetName(string countryCode)
        {
            if (string.IsNullOrWhiteSpace(countryCode))
                return string.Empty;

            var code = countryCode.Trim().ToUpper();

            try
            {
                // Use .NET's RegionInfo to get the country name from the code
                var region = new System.Globalization.RegionInfo(code);
                return region.EnglishName;
            }
            catch
            {
                // If the code is not valid, return empty string
                return string.Empty;
            }
        }

        /// <summary>
        /// Verifies if a country code exists in the valid ISO 3166-1 alpha-2 country codes
        /// </summary>
        /// <param name="countryCode">2-character country code to verify (e.g., "US", "FR", "GB")</param>
        /// <returns>True if the country code is a valid ISO country code, false otherwise</returns>
        public static bool IsValidCountryCode(string countryCode)
        {
            if (string.IsNullOrWhiteSpace(countryCode))
                return false;

            var code = countryCode.Trim().ToUpper();

            // Check if the code exists in the valid country codes list
            return _validCountryCodes.Contains(code);
        }

        /// <summary>
        /// Gets all valid ISO 3166-1 alpha-2 country codes
        /// </summary>
        /// <returns>Collection of all valid country codes</returns>
        public static IEnumerable<string> GetAllCountryCodes()
        {
            return _validCountryCodes;
        }
    }
}
