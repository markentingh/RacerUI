using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace RacerUI.Utils
{
    public static class Cars
    {
        public const string Unknown = "Unknown";

        private static readonly IReadOnlyList<CarClass> _carClasses = new List<CarClass>
        {
            // Formula
            new CarClass("Formula 1", "Formula", "formula 1", "formula one", "f1", "grand prix"),
            new CarClass("Formula 2", "Formula", "formula 2", "f2"),
            new CarClass("Formula 3", "Formula", "formula 3", "f3"),
            new CarClass("Formula 4", "Formula", "formula 4", "f4"),
            new CarClass("Formula E", "Formula", "formula e", "electric formula"),
            new CarClass("Formula Regional", "Formula", "formula regional", "frm"),
            new CarClass("Super Formula", "Formula", "super formula"),
            new CarClass("IndyCar", "Formula", "indycar", "indy car"),
            new CarClass("Indy Lights", "Formula", "indy lights", "indylights"),
            new CarClass("Formula Ford", "Formula", "formula ford", "ff1600", "ff2000"),
            new CarClass("Formula Vee", "Formula", "formula vee"),
            new CarClass("Formula Renault", "Formula", "formula renault"),
            new CarClass("Formula 5000", "Formula", "formula 5000", "f5000"),
            new CarClass("Formula Atlantic", "Formula", "formula atlantic"),

            // GT
            new CarClass("GT1", "GT (Grand Touring)", "gt1"),
            new CarClass("GT2", "GT (Grand Touring)", "gt2"),
            new CarClass("GT3", "GT (Grand Touring)", "gt3"),
            new CarClass("GT4", "GT (Grand Touring)", "gt4"),
            new CarClass("GTE", "GT (Grand Touring)", "gte", "lmgte"),
            new CarClass("GTD", "GT (Grand Touring)", "gtd"),
            new CarClass("GT Cup", "GT (Grand Touring)", "gt cup"),
            new CarClass("Super GT", "GT (Grand Touring)", "super gt", "jgtc"),
            new CarClass("GT500", "GT (Grand Touring)", "gt500"),
            new CarClass("GT300", "GT (Grand Touring)", "gt300"),
            new CarClass("GTO", "GT (Grand Touring)", "gto"),
            new CarClass("GTU", "GT (Grand Touring)", "gtu"),

            // Prototype / Sports Car
            new CarClass("LMP1", "Prototype/Sports Car", "lmp1", "lmp1-h"),
            new CarClass("LMP2", "Prototype/Sports Car", "lmp2"),
            new CarClass("LMP3", "Prototype/Sports Car", "lmp3"),
            new CarClass("LMP900", "Prototype/Sports Car", "lmp900"),
            new CarClass("LMPC", "Prototype/Sports Car", "lmpc"),
            new CarClass("DPi", "Prototype/Sports Car", "dpi", "daytona prototype"),
            new CarClass("Hypercar", "Prototype/Sports Car", "hypercar", "lmh"),
            new CarClass("LMDh", "Prototype/Sports Car", "lmdh"),
            new CarClass("Group C", "Prototype/Sports Car", "group c", "gr.c", "gr. c", "GrC"),
            new CarClass("Group 6", "Prototype/Sports Car", "group 6", "gr.6", "gr. 6", "GrC"),
            new CarClass("Can-Am", "Prototype/Sports Car", "can-am", "can am"),
            new CarClass("IMSA GTP", "Prototype/Sports Car", "imsa gtp", "gtp"),
            new CarClass("WSC", "Prototype/Sports Car", "wsc", "world sportscar"),
            new CarClass("P1", "Prototype/Sports Car", "p1"),
            new CarClass("P2", "Prototype/Sports Car", "p2"),

            // Touring Car
            new CarClass("TCR", "Touring Car", "tcr"),
            new CarClass("Super 2000", "Touring Car", "super 2000", "s2000"),
            new CarClass("Group A", "Touring Car", "group a", "gr.a", "gr. a", "GrA"),
            new CarClass("Group N", "Touring Car", "group n", "gr.n", "gr. n", "GrN"),
            new CarClass("WTCC", "Touring Car", "wtcc", "world touring car", "wtcr"),
            new CarClass("BTCC", "Touring Car", "btcc", "british touring car"),
            new CarClass("DTM", "Touring Car", "dtm", "deutsche tourenwagen", "german touring car"),
            new CarClass("Super Touring", "Touring Car", "super touring"),
            new CarClass("Silhouette", "Touring Car", "silhouette"),
            new CarClass("V8 Supercars", "Touring Car", "v8 supercars", "supercars championship"),
            new CarClass("Trans-Am", "Touring Car", "trans-am", "trans am"),
            new CarClass("IMSA GTU", "Touring Car", "imsa gtu"),
            new CarClass("Group 5", "Touring Car", "group 5", "gr.5", "gr. 5"),

            // Rally
            new CarClass("WRC", "Rally", "wrc", "r1", "world rally"),
            new CarClass("Group B (Rally)", "Rally", "group b rally", "gr.b rally", "gr. b rally", "GrBRally"),
            new CarClass("Group A (Rally)", "Rally", "group a rally", "gr.a rally", "gr. a rally", "GrARally"),
            new CarClass("Group N (Rally)", "Rally", "group n rally", "gr.n rally", "gr. n rally", "GrNRally"),
            new CarClass("Rally1", "Rally", "rally1", "rally 1"),
            new CarClass("Rally2 / R5", "Rally", "r5", "rally2", "rally 2"),
            new CarClass("Rally3 / R3", "Rally", "r3", "rally3", "rally 3"),
            new CarClass("Rally4 / R4", "Rally", "r4", "rally4", "rally 4"),
            new CarClass("Rally5 / R2", "Rally", "r2", "rally2", "rally 2"),
            new CarClass("Historic Rally", "Rally", "historic rally", "historic rally car"),
            new CarClass("Rallycross", "Rally", "rallycross", "rx", "rally cross"),
            new CarClass("Rallycross Supercar", "Rally", "rallycross supercar", "rx supercar"),
            new CarClass("Group S (Rally)", "Rally", "group s rally", "gr.s rally", "gr. s rally", "GrSRally"),

            // Stock Car
            new CarClass("NASCAR Cup", "Stock Car", "nascar cup", "cup series"),
            new CarClass("Xfinity", "Stock Car", "xfinity"),
            new CarClass("Truck Series", "Stock Car", "truck series", "craftsman truck"),
            new CarClass("ARCA", "Stock Car", "arca"),
            new CarClass("Super Late Model", "Stock Car", "super late model"),
            new CarClass("Late Model", "Stock Car", "late model"),
            new CarClass("Modified", "Stock Car", "modified stock"),
            new CarClass("Street Stock", "Stock Car", "street stock"),
            new CarClass("Pro Stock", "Stock Car", "pro stock"),

            // Other Racing
            new CarClass("Drift", "Other Racing", "drift", "drifting"),
            new CarClass("Time Attack", "Other Racing", "time attack", "super lap"),
            new CarClass("Hill Climb", "Other Racing", "hill climb", "pikes peak"),
            new CarClass("Autocross", "Other Racing", "autocross", "autoslalom", "solo"),
            new CarClass("Sprint Car", "Other Racing", "sprint car", "winged sprint"),
            new CarClass("Midget", "Other Racing", "midget"),
            new CarClass("Silver Crown", "Other Racing", "silver crown"),
            new CarClass("Legends Car", "Other Racing", "legends car", "legends"),
            new CarClass("Kart", "Other Racing", "kart", "karting", "go kart"),
            new CarClass("Off-Road Truck", "Other Racing", "off-road truck", "trophy truck", "stadium truck"),
            new CarClass("Off-Road Buggy", "Other Racing", "off-road buggy", "desert buggy"),
            new CarClass("Rock Crawler", "Other Racing", "rock crawler", "rock crawling"),
            new CarClass("Monster Truck", "Other Racing", "monster truck"),

            // Drag Racing
            new CarClass("Top Fuel", "Drag Racing", "top fuel"),
            new CarClass("Funny Car", "Drag Racing", "funny car"),
            new CarClass("Pro Stock Drag", "Drag Racing", "pro stock drag", "drag pro stock"),
            new CarClass("Pro Mod", "Drag Racing", "pro mod"),
            new CarClass("Super Stock Drag", "Drag Racing", "super stock drag"),
            new CarClass("Stock Drag", "Drag Racing", "stock drag"),
            new CarClass("Bracket Racing", "Drag Racing", "bracket racing"),

            // Historic / Vintage
            new CarClass("Veteran", "Historic/Vintage", "veteran"),
            new CarClass("Brass Era", "Historic/Vintage", "brass era"),
            new CarClass("Vintage", "Historic/Vintage", "vintage"),
            new CarClass("Post-Vintage", "Historic/Vintage", "post-vintage", "post vintage"),
            new CarClass("Classic", "Historic/Vintage", "classic", "pre-1980"),

            // Road Cars
            new CarClass("Microcar", "Road Car", "microcar"),
            new CarClass("Kei Car", "Road Car", "kei"),
            new CarClass("City Car", "Road Car", "city"),
            new CarClass("Compact", "Road Car", "compact"),
            new CarClass("Sedan", "Road Car", "sedan", "saloon", "four-door", "4-door"),
            new CarClass("Coupe", "Road Car", "coupe"),
            new CarClass("Roadster", "Road Car", "roadster", "cabrio"),
            new CarClass("Hatchback", "Road Car", "hatchback"),
            new CarClass("Hot Hatch", "Road Car", "hot hatch"),
            new CarClass("Station Wagon", "Road Car", "station wagon", "estate", "wagon", "shooting brake"),
            new CarClass("Crossover", "Road Car", "suv", "crossover", "sport utility"),
            new CarClass("Sports Car", "Road Car", "sportscar", "sports car"),
            new CarClass("Grand Tourer", "Road Car", "grand tourer", "gt road"),
            new CarClass("Muscle Car", "Road Car", "muscle"),
            new CarClass("Pony Car", "Road Car", "pony"),
            new CarClass("Supercar", "Road Car", "supercar"),
            new CarClass("Hypercar", "Road Car", "hypercar"),
            new CarClass("Megacar", "Road Car", "megacar"),
            new CarClass("Luxury", "Road Car", "luxury"),
            new CarClass("Executive", "Road Car", "executive")
        };

        public static IReadOnlyList<CarClass> CarClasses => _carClasses;

        public static string GetCarClass(string name, string description, string carClass)
        {
            var haystack = BuildHaystack(name, description, carClass);
            if (string.IsNullOrWhiteSpace(haystack))
            {
                return Unknown;
            }

            foreach (var candidate in _carClasses)
            {
                if (candidate.Keywords.Any(keyword => IsWordMatch(haystack, keyword)))
                {
                    return candidate.Name;
                }
            }

            return Unknown;
        }

        private static bool IsWordMatch(string text, string keyword)
        {
            // Use word boundary regex to ensure keyword matches as a whole word
            var pattern = $@"\b{Regex.Escape(keyword)}\b";
            return Regex.IsMatch(text, pattern, RegexOptions.IgnoreCase);
        }

        private static string BuildHaystack(params string[] values)
        {
            return string.Join(' ', values
                .Where(value => !string.IsNullOrWhiteSpace(value))).ToLower();
        }

        public sealed class CarClass
        {
            public CarClass(string name, string category, params string[] keywords)
            {
                Name = name;
                Category = category;
                Keywords = keywords.Select(keyword => keyword.ToLowerInvariant()).ToList();
            }

            public string Name { get; }
            public string Category { get; }
            public IReadOnlyList<string> Keywords { get; }
        }

        public sealed class CarMake
        {
            public CarMake(string name, string countryCode, string countryName, params string[] keywords)
            {
                Name = name;
                CountryCode = countryCode;
                CountryName = countryName;
                Keywords = keywords.Select(keyword => keyword.ToLowerInvariant()).ToList();
            }

            public string Name { get; }
            public string CountryCode { get; }
            public string CountryName { get; }
            public IReadOnlyList<string> Keywords { get; }
        }

        private static readonly IReadOnlyList<CarMake> _carMakes = new List<CarMake>
        {
            new CarMake("Abarth", "IT", "Italy", "abarth"),
            new CarMake("AC Legends", "GB", "United Kingdom", "ac legends"),
            new CarMake("ACR", "CZ", "Czech Republic", "acr"),
            new CarMake("AGS", "FR", "France", "ags"),
            new CarMake("Alba", "IT", "Italy", "alba"),
            new CarMake("Alfa Romeo", "IT", "Italy", "alfa romeo", "alfa", "romeo"),
            new CarMake("Alpina", "DE", "Germany", "alpina"),
            new CarMake("Alpine", "FR", "France", "alpine"),
            new CarMake("AMR", "GB", "United Kingdom", "amr"),
            new CarMake("Apollo", "DE", "Germany", "apollo", "gumpert"),
            new CarMake("Arrinera", "PL", "Poland", "arrinera"),
            new CarMake("Ascari", "GB", "United Kingdom", "ascari"),
            new CarMake("Aston Martin", "GB", "United Kingdom", "aston martin", "aston", "martin"),
            new CarMake("Audi", "DE", "Germany", "audi"),
            new CarMake("Austin", "GB", "United Kingdom", "austin"),
            new CarMake("Austin Healey", "GB", "United Kingdom", "austin healey", "healey"),
            new CarMake("Auto Union", "DE", "Germany", "auto union"),
            new CarMake("Autobianchi", "IT", "Italy", "autobianchi"),
            new CarMake("Avia", "CZ", "Czech Republic", "avia"),
            new CarMake("Avions", "FR", "France", "avions"),
            new CarMake("BAC", "GB", "United Kingdom", "bac"),
            new CarMake("Bentley", "GB", "United Kingdom", "bentley"),
            new CarMake("Berta", "AR", "Argentina", "berta"),
            new CarMake("Bertone", "IT", "Italy", "bertone"),
            new CarMake("Bizzarrini", "IT", "Italy", "bizzarrini"),
            new CarMake("BMW", "DE", "Germany", "bmw", "bavarian motor works"),
            new CarMake("Bowler", "GB", "United Kingdom", "bowler"),
            new CarMake("Brabham", "GB", "United Kingdom", "brabham"),
            new CarMake("Brabus", "DE", "Germany", "brabus"),
            new CarMake("Bugatti", "FR", "France", "bugatti"),
            new CarMake("Bufori", "MY", "Malaysia", "bufori"),
            new CarMake("Caparo", "GB", "United Kingdom", "caparo", "caper"),
            new CarMake("Caterham", "GB", "United Kingdom", "caterham"),
            new CarMake("Citroën", "FR", "France", "citroen", "citroën"),
            new CarMake("Cupra", "ES", "Spain", "cupra"),
            new CarMake("Czinger", "US", "United States", "czinger"),
            new CarMake("Dacia", "RO", "Romania", "dacia"),
            new CarMake("Dallara", "IT", "Italy", "dallara"),
            new CarMake("De Tomaso", "IT", "Italy", "de tomaso", "detomaso"),
            new CarMake("Delage", "FR", "France", "delage"),
            new CarMake("Dennis", "GB", "United Kingdom", "dennis"),
            new CarMake("Devel", "AE", "United Arab Emirates", "devel"),
            new CarMake("Donkervoort", "NL", "Netherlands", "donkervoort"),
            new CarMake("Duqueine", "FR", "France", "duqueine"),
            new CarMake("Facel", "FR", "France", "facel"),
            new CarMake("Ferrari", "IT", "Italy", "ferrari"),
            new CarMake("Fiat", "IT", "Italy", "fiat"),
            new CarMake("Gaya", "FR", "France", "gaya", "ga ya"),
            new CarMake("Gemballa", "DE", "Germany", "gemballa"),
            new CarMake("Gillet", "BE", "Belgium", "gillet"),
            new CarMake("Ginetta", "GB", "United Kingdom", "ginetta"),
            new CarMake("Glas", "DE", "Germany", "glas"),
            new CarMake("Gordon Murray", "GB", "United Kingdom", "gordon murray", "gordon murray automotive"),
            new CarMake("Hennessey", "US", "United States", "hennessey", "hennessy"),
            new CarMake("Hillman", "GB", "United Kingdom", "hillman"),
            new CarMake("Humber", "GB", "United Kingdom", "humber"),
            new CarMake("Iso", "IT", "Italy", "iso"),
            new CarMake("Jaguar", "GB", "United Kingdom", "jaguar"),
            new CarMake("Kenworth", "US", "United States", "kenworth"),
            new CarMake("Kimera", "IT", "Italy", "kimera"),
            new CarMake("Koenigsegg", "SE", "Sweden", "koenigsegg"),
            new CarMake("KTM", "AT", "Austria", "ktm"),
            new CarMake("Lamborghini", "IT", "Italy", "lamborghini", "lambo"),
            new CarMake("Lancia", "IT", "Italy", "lancia"),
            new CarMake("Land Rover", "GB", "United Kingdom", "land rover", "landrover"),
            new CarMake("Ligier", "FR", "France", "ligier"),
            new CarMake("Lister", "GB", "United Kingdom", "lister"),
            new CarMake("Lola", "GB", "United Kingdom", "lola"),
            new CarMake("Lotus", "GB", "United Kingdom", "lotus"),
            new CarMake("Lynk & Co", "CN", "China", "lynk & co", "lynk"),
            new CarMake("Maserati", "IT", "Italy", "maserati"),
            new CarMake("Mazzanti", "IT", "Italy", "mazzanti"),
            new CarMake("McLaren", "GB", "United Kingdom", "mclaren"),
            new CarMake("McMurtry", "GB", "United Kingdom", "mcmurtry"),
            new CarMake("Mercedes-Benz", "DE", "Germany", "mercedes-benz", "mercedes", "benz", "merc"),
            new CarMake("MG", "GB", "United Kingdom", "mg"),
            new CarMake("Mini", "GB", "United Kingdom", "mini", "mini cooper"),
            new CarMake("Morgan", "GB", "United Kingdom", "morgan"),
            new CarMake("Morris", "GB", "United Kingdom", "morris"),
            new CarMake("Nilu", "US", "United States", "nilu"),
            new CarMake("Noble", "GB", "United Kingdom", "noble"),
            new CarMake("Opel", "DE", "Germany", "opel"),
            new CarMake("Pagani", "IT", "Italy", "pagani"),
            new CarMake("Panoz", "US", "United States", "panoz"),
            new CarMake("Peugeot", "FR", "France", "peugeot"),
            new CarMake("Pilbeam", "GB", "United Kingdom", "pilbeam"),
            new CarMake("Pininfarina", "IT", "Italy", "pininfarina"),
            new CarMake("Polestar", "SE", "Sweden", "polestar"),
            new CarMake("Porsche", "DE", "Germany", "porsche"),
            new CarMake("Quadra", "PL", "Poland", "quadra"),
            new CarMake("Radical", "GB", "United Kingdom", "radical"),
            new CarMake("Railton", "GB", "United Kingdom", "railton"),
            new CarMake("Rebellion", "CH", "Switzerland", "rebellion"),
            new CarMake("Reliant", "GB", "United Kingdom", "reliant"),
            new CarMake("Renault", "FR", "France", "renault"),
            new CarMake("Reynard", "GB", "United Kingdom", "reynard"),
            new CarMake("Rimac", "HR", "Croatia", "rimac"),
            new CarMake("Rolls-Royce", "GB", "United Kingdom", "rolls-royce", "rolls", "royce"),
            new CarMake("Rossion", "US", "United States", "rossion"),
            new CarMake("Rover", "GB", "United Kingdom", "rover"),
            new CarMake("RUF", "DE", "Germany", "ruf"),
            new CarMake("Saab", "SE", "Sweden", "saab"),
            new CarMake("Saleen", "US", "United States", "saleen"),
            new CarMake("Seat", "ES", "Spain", "seat"),
            new CarMake("Shelby", "US", "United States", "shelby"),
            new CarMake("Simca", "FR", "France", "simca"),
            new CarMake("Škoda", "CZ", "Czech Republic", "skoda", "škoda"),
            new CarMake("Smart", "DE", "Germany", "smart"),
            new CarMake("Spada", "IT", "Italy", "spada"),
            new CarMake("Spyker", "NL", "Netherlands", "spyker"),
            new CarMake("SSC", "US", "United States", "ssc"),
            new CarMake("Sunbeam", "GB", "United Kingdom", "sunbeam"),
            new CarMake("Tatuus", "IT", "Italy", "tatuus"),
            new CarMake("TECHART", "DE", "Germany", "techart"),
            new CarMake("Tesla", "US", "United States", "tesla"),
            new CarMake("Triumph", "GB", "United Kingdom", "triumph"),
            new CarMake("TVR", "GB", "United Kingdom", "tvr"),
            new CarMake("Ultima", "GB", "United Kingdom", "ultima"),
            new CarMake("Vauxhall", "GB", "United Kingdom", "vauxhall"),
            new CarMake("Venturi", "FR", "France", "venturi"),
            new CarMake("Volkswagen", "DE", "Germany", "volkswagen", "vw"),
            new CarMake("Volvo", "SE", "Sweden", "volvo"),
            new CarMake("Wiesmann", "DE", "Germany", "wiesmann"),
            new CarMake("WMotors", "AE", "United Arab Emirates", "w motors", "wmotors"),
            new CarMake("Zenvo", "DK", "Denmark", "zenvo"),
    
            // American Manufacturers
            new CarMake("Buick", "US", "United States", "buick"),
            new CarMake("Cadillac", "US", "United States", "cadillac", "caddy"),
            new CarMake("Callaway", "US", "United States", "callaway"),
            new CarMake("Chaparral", "US", "United States", "chaparral"),
            new CarMake("Checker", "US", "United States", "checker"),
            new CarMake("Chevrolet", "US", "United States", "chevrolet", "chevy"),
            new CarMake("Chrysler", "US", "United States", "chrysler"),
            new CarMake("Dodge", "US", "United States", "dodge"),
            new CarMake("Eagle", "US", "United States", "eagle"),
            new CarMake("Fisker", "US", "United States", "fisker"),
            new CarMake("Ford", "US", "United States", "ford"),
            new CarMake("GMC", "US", "United States", "gmc", "general motors"),
            new CarMake("Hudson", "US", "United States", "hudson"),
            new CarMake("Hummer", "US", "United States", "hummer"),
            new CarMake("Jeep", "US", "United States", "jeep"),
            new CarMake("Lincoln", "US", "United States", "lincoln"),
            new CarMake("Mercury", "US", "United States", "mercury"),
            new CarMake("Oldsmobile", "US", "United States", "oldsmobile"),
            new CarMake("Packard", "US", "United States", "packard"),
            new CarMake("Plymouth", "US", "United States", "plymouth"),
            new CarMake("Pontiac", "US", "United States", "pontiac"),
            new CarMake("Powell", "US", "United States", "powell", "powell motors"),
            new CarMake("Saturn", "US", "United States", "saturn"),
            new CarMake("Scion", "US", "United States", "scion"),
            new CarMake("Vector", "US", "United States", "vector"),
            new CarMake("Willys", "US", "United States", "willys"),
    
            // Japanese Manufacturers
            new CarMake("Acura", "JP", "Japan", "acura"),
            new CarMake("Amuse", "JP", "Japan", "amuse"),
            new CarMake("Autobacs", "JP", "Japan", "autobacs"),
            new CarMake("Autozam", "JP", "Japan", "autozam"),
            new CarMake("Daihatsu", "JP", "Japan", "daihatsu"),
            new CarMake("Datsun", "JP", "Japan", "datsun"),
            new CarMake("Dome", "JP", "Japan", "dome"),
            new CarMake("Honda", "JP", "Japan", "honda"),
            new CarMake("Infiniti", "JP", "Japan", "infiniti", "infini"),
            new CarMake("Isuzu", "JP", "Japan", "isuzu", "izuzu"),
            new CarMake("Kawasaki", "JP", "Japan", "kawasaki"),
            new CarMake("Lexus", "JP", "Japan", "lexus"),
            new CarMake("Mazda", "JP", "Japan", "mazda"),
            new CarMake("Mitsubishi", "JP", "Japan", "mitsubishi", "mits"),
            new CarMake("Nissan", "JP", "Japan", "nissan", "nissian"),
            new CarMake("Subaru", "JP", "Japan", "subaru", "subarute"),
            new CarMake("Suzuki", "JP", "Japan", "suzuki"),
            new CarMake("Toyota", "JP", "Japan", "toyota", "mazyota"),
            new CarMake("Yamaha", "JP", "Japan", "yamaha"),
    
            // Korean Manufacturers
            new CarMake("Daewoo", "KR", "South Korea", "daewoo"),
            new CarMake("Genesis", "KR", "South Korea", "genesis"),
            new CarMake("Hyundai", "KR", "South Korea", "hyundai"),
            new CarMake("Kia", "KR", "South Korea", "kia"),
    
            // Australian Manufacturers
            new CarMake("Holden", "AU", "Australia", "holden"),
            new CarMake("HSV", "AU", "Australia", "hsv"),
    
            // Chinese Manufacturers
            new CarMake("BYD", "CN", "China", "byd"),
            new CarMake("ChangAn", "CN", "China", "changan"),
            new CarMake("GAC", "CN", "China", "gac"),
            new CarMake("Geely", "CN", "China", "geely"),
            new CarMake("Hongqi", "CN", "China", "hongqi", "hong qi"),
            new CarMake("NIO", "CN", "China", "nio"),
            new CarMake("Wuling", "CN", "China", "wuling"),
            new CarMake("Xiao Mi", "CN", "China", "xiao mi", "xiaomi"),
            new CarMake("Zhiji", "CN", "China", "zhiji"),
    
            // Russian Manufacturers
            new CarMake("AZLK", "RU", "Russia", "azlk"),
            new CarMake("GAZ", "RU", "Russia", "gaz"),
            new CarMake("Lada", "RU", "Russia", "lada", "vaz"),
            new CarMake("Melkus", "RU", "Russia", "melkus"),
            new CarMake("Moskvich", "RU", "Russia", "moskvich"),
            new CarMake("UAZ", "RU", "Russia", "uaz"),
            new CarMake("ZAZ", "RU", "Russia", "zaz")
        };

        public static IReadOnlyList<CarMake> CarMakes => _carMakes;

        public static string GetCarMake(string name, string description)
        {
            var haystack = BuildHaystack(name, description);
            if (string.IsNullOrWhiteSpace(haystack))
            {
                return string.Empty;
            }
    
            foreach (var candidate in _carMakes)
            {
                if (candidate.Keywords.Any(keyword => IsWordMatch(haystack, keyword)))
                {
                    return candidate.Name;
                }
            }
    
            return string.Empty;
        }

        public static (string CountryCode, string CountryName) GetCarCountry(string makeName)
        {
            var make = _carMakes.FirstOrDefault(m => m.Name.Equals(makeName, StringComparison.OrdinalIgnoreCase));
            return make != null ? (make.CountryCode, make.CountryName) : (string.Empty, string.Empty);
        }

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

        public static char GetVersion(string version, int index)
        {
            if (string.IsNullOrEmpty(version)) return '0';
            if (index < 0 || index >= version.Length) return '0';
            
            return version[index];
        }
    }
}
