using System.Globalization;

namespace RacerUI.Utils
{
    public static class AssettoCorsaHelper
    {
        public static string[] GetDriverNames(string names)
        {
            TextInfo textInfo = CultureInfo.CurrentCulture.TextInfo;
            var namelist = names.Replace("/",",").Replace("-",",").Replace("\\",",").Replace("_", " ")
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(a => a.Trim()).Where(a => a.Length > 0).Distinct()
                .Select(a => textInfo.ToTitleCase(a.ToLower()));
            return namelist.ToArray();
        }
    }
}
