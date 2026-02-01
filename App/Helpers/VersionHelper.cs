namespace RacerUI.Helpers
{
    public static class VersionHelper
    {
        /// <summary>
        /// Sets a character at a specific index in a version string
        /// </summary>
        /// <param name="version">The version string to modify</param>
        /// <param name="index">The index position to set</param>
        /// <param name="value">The character value to set</param>
        /// <returns>The modified version string</returns>
        public static string SetVersion(string version, int index, char value)
        {
            if (string.IsNullOrEmpty(version)) version = string.Empty;
            if (index < 0) return version;
            
            if (index >= version.Length)
            {
                version = version.PadRight(index + 1, '0');
            }

            var chars = version.ToCharArray();
            chars[index] = value;
            return new string(chars);
        }

        /// <summary>
        /// Gets a character at a specific index in a version string
        /// </summary>
        /// <param name="version">The version string to read from</param>
        /// <param name="index">The index position to read</param>
        /// <returns>The character at the specified index, or '0' if not found</returns>
        public static char GetVersion(string version, int index)
        {
            if (string.IsNullOrEmpty(version)) return '0';
            if (index < 0 || index >= version.Length) return '0';
            
            return version[index];
        }
    }
}
