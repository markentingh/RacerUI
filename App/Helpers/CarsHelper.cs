using System.Text.RegularExpressions;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Globalization;
using RacerUI.Entities;
using RacerUI.Models;
using AssettoTools;

namespace RacerUI.Helpers
{
    public static class CarsHelper
    {
        public const string Unknown = "Unknown";

        private static readonly IReadOnlyList<CarClass> _carClasses = new List<CarClass>
        {
            // Formula
            new CarClass("Formula 1", "Formula", 1950, 2100, 600, 1100, 0.6m, 1.2m, "", "formula 1", "formula one", "f1", "grand prix"),
            new CarClass("Formula 2", "Formula", 1948, 2100, 450, 650, 1.0m, 2.0m, "", "formula 2", "f2"),
            new CarClass("Formula 3", "Formula", 1950, 2100, 200, 400, 1.5m, 3.0m, "", "formula 3", "f3"),
            new CarClass("Formula 4", "Formula", 2014, 2100, 140, 180, 2.5m, 4.0m, "", "formula 4", "f4"),
            new CarClass("Formula E", "Formula", 2014, 2100, 250, 350, 2.0m, 3.5m, "", "formula e", "electric formula"),
            new CarClass("Formula Regional", "Formula", 2018, 2100, 260, 280, 2.0m, 3.0m, "", "formula regional", "frm"),
            new CarClass("Super Formula", "Formula", 1996, 2100, 550, 700, 1.0m, 2.0m, "", "super formula"),
            new CarClass("IndyCar", "Formula", 1996, 2100, 550, 750, 1.0m, 2.0m, "", "indycar", "indy car"),
            new CarClass("Indy Lights", "Formula", 2002, 2100, 400, 500, 1.5m, 2.5m, "", "indy lights", "indylights"),
            new CarClass("Formula Ford", "Formula", 1967, 2100, 100, 180, 3.0m, 5.0m, "", "formula ford", "ff1600", "ff2000"),
            new CarClass("Formula Vee", "Formula", 1963, 2100, 50, 100, 4.0m, 7.0m, "", "formula vee"),
            new CarClass("Formula Renault", "Formula", 1971, 2100, 180, 280, 2.0m, 3.5m, "", "formula renault"),
            new CarClass("Formula 5000", "Formula", 1968, 1982, 400, 550, 1.5m, 2.5m, "", "formula 5000", "f5000"),
            new CarClass("Formula Atlantic", "Formula", 1974, 2100, 200, 280, 2.0m, 3.5m, "", "formula atlantic"),

            // GT
            new CarClass("GT1", "GT (Grand Touring)", 1993, 2012, 500, 700, 1.5m, 2.5m, "", "gt1"),
            new CarClass("GT2", "GT (Grand Touring)", 1994, 2011, 400, 550, 2.0m, 3.0m, "", "gt2"),
            new CarClass("GT3", "GT (Grand Touring)", 2006, 2100, 450, 600, 2.0m, 3.5m, "", "gt3"),
            new CarClass("GT4", "GT (Grand Touring)", 2007, 2100, 350, 500, 2.5m, 4.0m, "", "gt4"),
            new CarClass("GTE", "GT (Grand Touring)", 2011, 2100, 450, 600, 2.0m, 3.5m, "", "gte", "lmgte"),
            new CarClass("GTD", "GT (Grand Touring)", 2014, 2100, 450, 600, 2.0m, 3.5m, "", "gtd"),
            new CarClass("GT Cup", "GT (Grand Touring)", 2000, 2100, 400, 550, 2.0m, 3.5m, "", "gt cup"),
            new CarClass("Super GT", "GT (Grand Touring)", 1993, 2100, 400, 650, 1.5m, 3.0m, "", "super gt", "jgtc"),
            new CarClass("GT500", "GT (Grand Touring)", 1993, 2100, 450, 650, 1.5m, 2.5m, "", "gt500"),
            new CarClass("GT300", "GT (Grand Touring)", 1993, 2100, 250, 400, 2.5m, 4.0m, "", "gt300"),
            new CarClass("GTO", "GT (Grand Touring)", 1962, 1993, 300, 500, 2.0m, 4.0m, "", "gto"),
            new CarClass("GTU", "GT (Grand Touring)", 1971, 1993, 200, 400, 2.5m, 5.0m, "", "gtu"),

            // Prototype / Sports Car
            new CarClass("LMP1", "Prototype/Sports Car", 1997, 2021, 500, 1000, 0.8m, 1.5m, "", "lmp1", "lmp1-h"),
            new CarClass("LMP2", "Prototype/Sports Car", 2005, 2100, 450, 650, 1.0m, 1.8m, "", "lmp2"),
            new CarClass("LMP3", "Prototype/Sports Car", 2015, 2100, 400, 470, 1.5m, 2.5m, "", "lmp3"),
            new CarClass("LMP900", "Prototype/Sports Car", 2000, 2007, 500, 700, 1.0m, 1.8m, "", "lmp900"),
            new CarClass("LMPC", "Prototype/Sports Car", 2009, 2016, 400, 500, 1.5m, 2.5m, "", "lmpc"),
            new CarClass("LMP", "Prototype/Sports Car", 1997, 2100, 400, 1000, 0.7m, 2.5m, "", "lmp"),
            new CarClass("DPi", "Prototype/Sports Car", 2017, 2100, 500, 700, 1.0m, 1.8m, "", "dpi", "daytona prototype"),
            new CarClass("Hypercar", "Prototype/Sports Car", 2021, 2100, 600, 800, 1.0m, 1.8m, "", "hypercar", "lmh"),
            new CarClass("LMDh", "Prototype/Sports Car", 2023, 2100, 600, 700, 1.0m, 1.8m, "", "lmdh"),
            new CarClass("Group C", "Prototype/Sports Car", 1982, 1993, 500, 1000, 0.8m, 1.5m, "", "group c", "gr.c", "gr. c", "GrC"),
            new CarClass("Group 6", "Prototype/Sports Car", 1966, 1971, 400, 700, 1.0m, 2.0m, "", "group 6", "gr.6", "gr. 6", "GrC"),
            new CarClass("Can-Am", "Prototype/Sports Car", 1966, 1987, 500, 1200, 0.7m, 1.5m, "", "can-am", "can am"),
            new CarClass("IMSA GTP", "Prototype/Sports Car", 1981, 1993, 500, 1000, 0.8m, 1.5m, "", "imsa gtp", "gtp"),
            new CarClass("WSC", "Prototype/Sports Car", 1982, 1992, 500, 900, 0.8m, 1.5m, "", "wsc", "world sportscar"),
            new CarClass("Proto1", "Prototype/Sports Car", 1990, 2100, 500, 800, 1.0m, 2.0m, "", "p1", "proto1", "proto 1"),
            new CarClass("Proto2", "Prototype/Sports Car", 1990, 2100, 400, 600, 1.5m, 2.5m, "", "p2", "proto2", "proto 2"),
            new CarClass("Prototype", "Prototype/Sports Car", 1900, 2100, 400, 2000, 0.0m, 3.0m, "", "prototype"),

            // Touring Car
            new CarClass("TCR", "Touring Car", 2015, 2100, 300, 380, 3.0m, 4.5m, "", "tcr"),
            new CarClass("Super 2000", "Touring Car", 2000, 2012, 260, 300, 3.5m, 5.0m, "", "super 2000", "s2000"),
            new CarClass("Group A", "Touring Car", 1982, 1993, 250, 400, 2.5m, 5.0m, "", "group a", "gr.a", "gr. a", "GrA"),
            new CarClass("Group N", "Touring Car", 1982, 2100, 200, 350, 3.0m, 6.0m, "", "group n", "gr.n", "gr. n", "GrN"),
            new CarClass("WTCC", "Touring Car", 2005, 2100, 260, 320, 3.5m, 5.0m, "", "wtcc", "world touring car", "wtcr"),
            new CarClass("BTCC", "Touring Car", 1958, 2100, 250, 350, 3.0m, 5.0m, "", "btcc", "british touring car"),
            new CarClass("DTM", "Touring Car", 1984, 2100, 400, 650, 2.0m, 3.5m, "", "dtm", "deutsche tourenwagen", "german touring car"),
            new CarClass("Super Touring", "Touring Car", 1990, 2000, 280, 320, 3.0m, 4.5m, "", "super touring"),
            new CarClass("Silhouette", "Touring Car", 1970, 1990, 400, 700, 1.5m, 3.0m, "", "silhouette"),
            new CarClass("V8 Supercars", "Touring Car", 1993, 2100, 600, 680, 2.0m, 3.0m, "RWD", "v8 supercars", "supercars championship"),
            new CarClass("Trans-Am", "Touring Car", 1966, 2100, 400, 900, 1.5m, 4.0m, "", "trans-am", "trans am", "transam"),
            new CarClass("IMSA GTU", "Touring Car", 1971, 1993, 200, 350, 2.5m, 5.0m, "", "imsa gtu"),
            new CarClass("Group 5", "Touring Car", 1966, 1982, 400, 800, 1.5m, 3.0m, "", "group 5", "gr.5", "gr. 5"),

            // Rally
            new CarClass("WRC", "Rally", 1973, 2100, 280, 400, 2.5m, 4.0m, "AWD", "wrc", "r1", "world rally"),
            new CarClass("Group B (Rally)", "Rally", 1982, 1986, 300, 600, 1.5m, 3.5m, "AWD", "group b rally", "gr.b rally", "gr. b rally", "GrBRally"),
            new CarClass("Group A (Rally)", "Rally", 1982, 1997, 250, 350, 2.5m, 4.5m, "AWD", "group a rally", "gr.a rally", "gr. a rally", "GrARally"),
            new CarClass("Group N (Rally)", "Rally", 1982, 2100, 200, 300, 3.5m, 6.0m, "AWD", "group n rally", "gr.n rally", "gr. n rally", "GrNRally"),
            new CarClass("Rally1", "Rally", 2022, 2100, 380, 500, 2.0m, 3.5m, "AWD", "rally1", "rally 1"),
            new CarClass("Rally2 / R5", "Rally", 2013, 2100, 270, 290, 3.0m, 4.5m, "AWD", "r5", "rally2", "rally 2"),
            new CarClass("Rally3 / R3", "Rally", 2013, 2100, 240, 260, 3.5m, 5.0m, "", "r3", "rally3", "rally 3"),
            new CarClass("Rally4 / R4", "Rally", 2013, 2100, 180, 200, 4.0m, 6.0m, "", "r4", "rally4", "rally 4"),
            new CarClass("Rally5 / R2", "Rally", 2013, 2100, 150, 180, 4.5m, 7.0m, "", "r2", "rally2", "rally 2"),
            new CarClass("Historic Rally", "Rally", 1900, 1980, 100, 300, 3.0m, 8.0m, "", "historic rally", "historic rally car"),
            new CarClass("Rallycross", "Rally", 1967, 2100, 300, 600, 1.5m, 4.0m, "AWD", "rallycross", "rx", "rally cross"),
            new CarClass("Rallycross Supercar", "Rally", 2014, 2100, 550, 650, 1.5m, 2.5m, "AWD", "rallycross supercar", "rx supercar"),
            new CarClass("Group S (Rally)", "Rally", 1985, 1987, 400, 650, 1.5m, 3.0m, "AWD", "group s rally", "gr.s rally", "gr. s rally", "GrSRally"),
            new CarClass("Rally", "Rally", 1900, 2100, 280, 700, 1.0m, 8.0m, "AWD", "gravel"),

            // Stock Car
            new CarClass("NASCAR Cup", "Stock Car", 1949, 2100, 700, 900, 1.5m, 2.5m, "RWD", "nascar cup", "cup series"),
            new CarClass("Xfinity", "Stock Car", 1982, 2100, 600, 750, 2.0m, 3.0m, "RWD", "xfinity"),
            new CarClass("Truck Series", "Stock Car", 1995, 2100, 600, 750, 2.0m, 3.0m, "RWD", "truck series", "craftsman truck"),
            new CarClass("ARCA", "Stock Car", 1953, 2100, 600, 750, 2.0m, 3.0m, "RWD", "arca"),
            new CarClass("Super Late Model", "Stock Car", 1980, 2100, 600, 850, 1.5m, 2.5m, "RWD", "super late model"),
            new CarClass("Late Model", "Stock Car", 1970, 2100, 400, 650, 2.0m, 3.5m, "RWD", "late model"),
            new CarClass("Modified", "Stock Car", 1960, 2100, 500, 750, 1.5m, 3.0m, "RWD", "modified stock"),
            new CarClass("Street Stock", "Stock Car", 1970, 2100, 300, 500, 2.5m, 4.5m, "RWD", "street stock"),
            new CarClass("Pro Stock", "Stock Car", 1970, 2100, 400, 600, 2.0m, 3.5m, "RWD", "pro stock"),

            // Other Racing
            new CarClass("Drift", "Other Racing", 1970, 2100, 200, 1000, 1.5m, 6.0m, "RWD", "drift", "drifting", "cg official"),
            new CarClass("Time Attack", "Other Racing", 1990, 2100, 300, 1200, 1.0m, 4.0m, "", "time attack", "timeattack", "super lap"),
            new CarClass("Hill Climb", "Other Racing", 1900, 2100, 200, 1500, 0.5m, 5.0m, "", "hill climb", "hillclimb", "pikes peak"),
            new CarClass("Autocross", "Other Racing", 1950, 2100, 100, 800, 2.0m, 8.0m, "", "autocross", "autoslalom", "solo"),
            new CarClass("Sprint Car", "Other Racing", 1930, 2100, 700, 950, 1.0m, 2.0m, "RWD", "sprint car", "winged sprint"),
            new CarClass("Midget", "Other Racing", 1930, 2100, 300, 450, 1.5m, 3.0m, "RWD", "midget"),
            new CarClass("Silver Crown", "Other Racing", 1970, 2100, 650, 850, 1.2m, 2.0m, "RWD", "silver crown"),
            new CarClass("Legends Car", "Other Racing", 1992, 2100, 120, 150, 4.0m, 6.0m, "RWD", "legends car", "legends"),
            new CarClass("Kart", "Other Racing", 1950, 2100, 5, 50, 3.0m, 15.0m, "RWD", "kart", "karting", "go kart"),
            new CarClass("Off-Road Truck", "Other Racing", 1970, 2100, 400, 1000, 1.5m, 4.0m, "AWD", "off-road truck", "offroad truck", "trophy truck", "stadium truck"),
            new CarClass("Off-Road Buggy", "Other Racing", 1960, 2100, 200, 800, 1.5m, 5.0m, "AWD", "off-road buggy", "offroad buggy", "desert buggy"),
            new CarClass("Rock Crawler", "Other Racing", 1980, 2100, 200, 500, 3.0m, 8.0m, "AWD", "rock crawler", "rock crawling"),
            new CarClass("Monster Truck", "Other Racing", 1970, 2100, 1200, 2000, 1.0m, 2.5m, "AWD", "monster truck", "monstertruck"),

            // Drag Racing
            new CarClass("Top Fuel", "Drag Racing", 1950, 2100, 8000, 12000, 0.3m, 0.6m, "RWD", "top fuel"),
            new CarClass("Funny Car", "Drag Racing", 1960, 2100, 8000, 12000, 0.4m, 0.7m, "RWD", "funny car"),
            new CarClass("Pro Stock Drag", "Drag Racing", 1970, 2100, 1200, 1500, 0.8m, 1.5m, "RWD", "pro stock drag", "drag pro stock"),
            new CarClass("Pro Mod", "Drag Racing", 1980, 2100, 2500, 4000, 0.5m, 1.0m, "RWD", "pro mod"),
            new CarClass("Super Stock Drag", "Drag Racing", 1960, 2100, 600, 1000, 1.5m, 3.0m, "RWD", "super stock drag"),
            new CarClass("Stock Drag", "Drag Racing", 1950, 2100, 300, 700, 2.0m, 5.0m, "RWD", "stock drag"),
            new CarClass("Bracket Racing", "Drag Racing", 1960, 2100, 200, 2000, 1.0m, 8.0m, "RWD", "bracket racing"),

            // Historic / Vintage
            new CarClass("Veteran", "Historic/Vintage", 1900, 1918, 10, 100, 10.0m, 50.0m, "", "veteran"),
            new CarClass("Brass Era", "Historic/Vintage", 1896, 1915, 10, 80, 15.0m, 60.0m, "", "brass era"),
            new CarClass("Vintage", "Historic/Vintage", 1919, 1930, 30, 150, 8.0m, 30.0m, "", "vintage"),
            new CarClass("Post-Vintage", "Historic/Vintage", 1931, 1945, 50, 200, 6.0m, 25.0m, "", "post-vintage", "post vintage"),
            new CarClass("Classic", "Historic/Vintage", 1946, 1980, 100, 400, 3.0m, 15.0m, "", "classic", "pre-1980"),

            // Road Cars
            new CarClass("Microcar", "Road Car", 1950, 2100, 10, 100, 5.0m, 40.0m, "", "microcar"),
            new CarClass("Kei Car", "Road Car", 1949, 2100, 30, 80, 10.0m, 25.0m, "", "kei"),
            new CarClass("City Car", "Road Car", 1960, 2100, 40, 100, 8.0m, 20.0m, "", "city"),
            new CarClass("Compact", "Road Car", 1950, 2100, 60, 200, 5.0m, 15.0m, "", "compact"),
            new CarClass("Sedan", "Road Car", 1900, 2100, 80, 700, 2.0m, 20.0m, "", "sedan", "saloon", "four-door", "4-door"),
            new CarClass("Coupe", "Road Car", 1900, 2100, 100, 800, 1.5m, 15.0m, "", "coupe"),
            new CarClass("Roadster", "Road Car", 1900, 2100, 80, 600, 2.0m, 15.0m, "", "roadster", "cabrio"),
            new CarClass("Hot Hatchback", "Road Car", 1975, 2100, 150, 450, 2.5m, 8.0m, "", "hot hatch", "hot hatchback"),
            new CarClass("Hatchback", "Road Car", 1960, 2100, 60, 400, 3.0m, 18.0m, "", "hatchback"),
            new CarClass("Station Wagon", "Road Car", 1920, 2100, 80, 600, 2.5m, 20.0m, "", "station wagon", "estate", "wagon", "shooting brake"),
            new CarClass("Crossover", "Road Car", 1980, 2100, 100, 700, 2.0m, 15.0m, "", "suv", "crossover", "sport utility"),
            new CarClass("Sports Car", "Road Car", 1900, 2100, 150, 700, 1.5m, 10.0m, "", "sportscar", "sports car"),
            new CarClass("Grand Tourer", "Road Car", 1950, 2100, 200, 800, 1.5m, 8.0m, "", "grand tourer", "gt road", "gt"),
            new CarClass("Muscle Car", "Road Car", 1960, 1980, 250, 500, 2.5m, 6.0m, "RWD", "muscle", "muslcecar", "muscle car"),
            new CarClass("Pony Car", "Road Car", 1964, 2100, 200, 500, 2.5m, 7.0m, "RWD", "pony", "ponycar", "pony car"),
            new CarClass("Supercar", "Road Car", 1960, 2100, 400, 1000, 1.0m, 4.0m, "", "supercar", "super car"),
            new CarClass("Hypercar", "Road Car", 1990, 2100, 600, 1600, 0.8m, 2.5m, "", "hypercar", "hyper car"),
            new CarClass("Megacar", "Road Car", 2010, 2100, 1000, 2000, 0.6m, 1.5m, "", "megacar", "mega car"),
            new CarClass("Luxury", "Road Car", 1920, 2100, 150, 700, 2.0m, 15.0m, "", "luxury"),
            new CarClass("Executive", "Road Car", 1950, 2100, 150, 600, 2.5m, 12.0m, "", "executive"),
            new CarClass("Super Street", "Road Car", 1950, 2100, 100, 2500, 0.5m, 12.0m, "", "super street"),
            new CarClass("Street", "Road Car", 1950, 2100, 100, 2500, 0.5m, 12.0m, "", "street", "road"),
            new CarClass("Touge", "Road Car", 1950, 2100, 100, 2500, 0.5m, 12.0m, "", "touge"),
            new CarClass("Traffic", "Road Car", 1900, 2100, 100, 2500, 0.5m, 12.0m, "", "traffic"),
            new CarClass("Touring", "Road Car", 1900, 2100, 100, 2500, 0.5m, 12.0m, "", "touring", "tc"),

            // Swedish Youth Vehicles
            new CarClass("EPA B", "Swedish Youth Vehicle", 1950, 1975, 40, 150, 6.0m, 25.0m, "", "epa b", "epa-b"),
            new CarClass("EPA / A-traktor", "Swedish Youth Vehicle", 1950, 2100, 50, 200, 5.0m, 20.0m, "", "epa", "a-traktor", "a traktor", "atraktor"),
            new CarClass("Moped Car", "Swedish Youth Vehicle", 2003, 2100, 4, 15, 30.0m, 100.0m, "", "moped car", "mopedcar"),

            // Tractor Pulling
            new CarClass("Super Stock Tractor", "Tractor Pulling", 1960, 2100, 300, 600, 2.0m, 5.0m, "", "super stock tractor", "tractor super stock"),
            new CarClass("Pro Stock Tractor", "Tractor Pulling", 1970, 2100, 500, 1000, 1.5m, 3.5m, "", "pro stock tractor", "tractor pro stock"),
            new CarClass("Modified Tractor", "Tractor Pulling", 1960, 2100, 800, 2000, 1.0m, 2.5m, "", "modified tractor", "tractor modified"),
            new CarClass("Super Modified Tractor", "Tractor Pulling", 1970, 2100, 1500, 3500, 0.5m, 1.5m, "", "super modified tractor", "tractor super modified"),
            new CarClass("Light Limited Tractor", "Tractor Pulling", 1960, 2100, 200, 400, 3.0m, 6.0m, "", "light limited", "super farm", "super farm tractor"),
            new CarClass("Altered Tractor", "Tractor Pulling", 1970, 2100, 2000, 5000, 0.4m, 1.2m, "", "altered tractor", "tractor altered"),
            new CarClass("Light Super Stock Tractor", "Tractor Pulling", 1960, 2100, 250, 500, 2.5m, 5.0m, "", "light super stock", "light super stock tractor"),
            new CarClass("Two-Wheel Drive Tractor", "Tractor Pulling", 1960, 2100, 300, 1500, 1.5m, 5.0m, "RWD", "two-wheel drive tractor", "2wd tractor", "two wheel drive tractor"),
            new CarClass("Four-Wheel Drive Tractor", "Tractor Pulling", 1960, 2100, 500, 2500, 1.0m, 4.0m, "AWD", "four-wheel drive tractor", "4wd tractor", "four wheel drive tractor"),

            // Garden Tractor Racing
            new CarClass("Stock Garden Tractor", "Garden Tractor Racing", 1960, 2100, 15, 30, 15.0m, 35.0m, "RWD", "stock garden tractor", "garden tractor stock"),
            new CarClass("Modified Garden Tractor", "Garden Tractor Racing", 1960, 2100, 30, 80, 8.0m, 20.0m, "RWD", "modified garden tractor", "garden tractor modified"),
            new CarClass("Outlaw Garden Tractor", "Garden Tractor Racing", 1960, 2100, 80, 200, 4.0m, 12.0m, "RWD", "outlaw garden tractor", "garden tractor outlaw"),

            // Lawn Mower Racing
            new CarClass("Stock Mower", "Lawn Mower Racing", 1960, 2100, 10, 25, 20.0m, 50.0m, "RWD", "stock mower", "stock lawn mower"),
            new CarClass("Modified Mower", "Lawn Mower Racing", 1960, 2100, 25, 60, 10.0m, 30.0m, "RWD", "modified mower", "modified lawn mower"),
            new CarClass("Prepared Mower", "Lawn Mower Racing", 1960, 2100, 60, 150, 5.0m, 15.0m, "RWD", "prepared mower", "prepared lawn mower"),

            // Agricultural/Utility
            new CarClass("Farm Tractor", "Agricultural/Utility", 1900, 2100, 20, 400, 5.0m, 50.0m, "", "farm tractor", "agricultural tractor"),
            new CarClass("Compact Tractor", "Agricultural/Utility", 1950, 2100, 15, 100, 10.0m, 60.0m, "", "compact tractor", "utility tractor"),
            new CarClass("Vintage Tractor", "Agricultural/Utility", 1900, 1970, 10, 150, 10.0m, 80.0m, "", "vintage tractor", "historic tractor", "antique tractor"),

        };

        public static IReadOnlyList<CarClass> CarClasses => _carClasses;
        public static string AllCarClasses = String.Join(", ", _carClasses.Select(c => c.Name));
        public static Dictionary<string, List<CarClass>> AllClassesByCategory = _carClasses
            .GroupBy(c => c.Category)
            .ToDictionary(g => g.Key, g => g.ToList());

        public static string GetCarClass(string name, string description, string carClass, int year = 0, string bhp = "", string weight = "", string driveTrain = "")
        {
            var haystack = BuildHaystack(carClass, name, description);
            if (string.IsNullOrWhiteSpace(haystack))
            {
                return Unknown;
            }

            // Parse BHP and weight, removing non-numerical characters
            //int parsedBhp = 0;
            //int parsedWeight = 0;
            //decimal pwRatio = 0;
            //
            //if (!string.IsNullOrEmpty(bhp))
            //{
            //    var bhpNumeric = Regex.Replace(bhp, @"[^0-9]", "");
            //    int.TryParse(bhpNumeric, out parsedBhp);
            //}
            //
            //if (!string.IsNullOrEmpty(weight))
            //{
            //    var weightNumeric = Regex.Replace(weight, @"[^0-9]", "");
            //    int.TryParse(weightNumeric, out parsedWeight);
            //}

            // Calculate power-to-weight ratio (weight / bhp)
            //if (parsedBhp > 0 && parsedWeight > 0)
            //{
            //    pwRatio = (decimal)parsedWeight / (decimal)parsedBhp;
            //}

            foreach (var candidate in _carClasses)
            {
                if (candidate.Keywords.Any(keyword => IsWordMatch(haystack, keyword)))
                {
                    // Check if year is within range
                    //if (year > 0 && (year < candidate.MinYear || year > candidate.MaxYear))
                    //    continue;

                    // Check if BHP is within range
                    //if (parsedBhp > 0 && candidate.MaxBhp > 0 && (parsedBhp < candidate.MinBhp || parsedBhp > candidate.MaxBhp))
                    //    continue;
                    //
                    //// Check if PWR is within range
                    //if (pwRatio > 0 && candidate.MaxPWR > 0 && (pwRatio < candidate.MinPWR || pwRatio > candidate.MaxPWR))
                    //    continue;
                    //
                    //// Check if drivetrain matches (if specified)
                    //if (!string.IsNullOrEmpty(candidate.DriveTrain) && !string.IsNullOrEmpty(driveTrain))
                    //{
                    //    if (!candidate.DriveTrain.Equals(driveTrain, StringComparison.OrdinalIgnoreCase))
                    //        continue;
                    //}

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

        public static string CleanUnwantedClasses(string specSheet)
        {
            if (string.IsNullOrWhiteSpace(specSheet))
                return specSheet;

            var unwantedClasses = new[]
            {
                "stock car",
                "sports car",
                "stock"
            };

            var cleanedText = specSheet;
            foreach (var unwanted in unwantedClasses)
            {
                // Use word boundary regex to ensure we only match whole words/phrases
                var pattern = $@"\b{Regex.Escape(unwanted)}\b";
                cleanedText = Regex.Replace(cleanedText, pattern, "", RegexOptions.IgnoreCase);
            }

            return cleanedText;
        }

        public sealed class CarClass
        {
            public CarClass(string name, string category, params string[] keywords)
                : this(name, category, 0, 2100, 0, 999999, 0, 999, "", keywords)
            {
            }

            public CarClass(string name, string category, int minYear, int maxYear, int minBhp, int maxBhp, decimal minPWR, decimal maxPWR, string driveTrain, params string[] keywords)
            {
                Name = name;
                Category = category;
                MinYear = minYear;
                MaxYear = maxYear;
                MinBhp = minBhp;
                MaxBhp = maxBhp;
                MinPWR = minPWR;
                MaxPWR = maxPWR;
                DriveTrain = driveTrain ?? "";
                Keywords = keywords.Select(keyword => keyword.ToLowerInvariant()).ToList();
            }

            public string Name { get; }
            public string Category { get; }
            public int MinYear { get; }
            public int MaxYear { get; }
            public int MinBhp { get; }
            public int MaxBhp { get; }
            public decimal MinPWR { get; }
            public decimal MaxPWR { get; }
            public string DriveTrain { get; }
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

        public static async Task GetCarDetailsFromAI(Car car, string carInfo)
        {
            if (!string.IsNullOrEmpty(car.Details) && !string.IsNullOrEmpty(car.Country)) return; //already used AI to generate details

            var systemPrompt =
                @$"
You are a racing simulator expert that can provide detailed information about vehicle mods for Assetto Corsa. 
The user will provide information about a specific vehicle mod that they have, and you will generate all
factual data that you know about the car mod, and if the vehicle mod is associated with a real vehicle,
you must provide all the data you have about the real vehicle as well.

#Definitions#
Name: vehicle display name (Make Model Extra). Make sure to clean up the name since this is being used in a video game, so no leading or trailing underscores unless its part of the author name, and no periods or dashes between words
Make: vehicle manufacturer
Model: vehicle model
Extra: any additional information about the vehicle that should be part of the display name, typically found in the car name taken from car.ini
Class: vehicle classification
Author: The person or team that developed the car mod
Country: The country of origin of the car, as a 2 character country code in all caps
Types: an array of strings selected from the available list of types below, selecting only the items that represent the type of vehicle.
Available Types: {string.Join(", ", App.CarTypes.Select(a => a.Name))}
Styles: an array of strings selected from the available list below, selecting only the items that represent the styles applied to the vehicle.
Available Styles: {string.Join(", ", App.CarStylings.Select(a => a.Name))}
Specializations: an array of strings from the available list below, selecting only the items that describe what the vehicle is primarily used for
Available Specializations: {string.Join(", ", App.CarSpecializations.Select(a => a.Name))}
Short Description: one sentence describing the car. Do not mention that it is a mod for a game.
minBHP: The minimum brake horsepower of the vehicle. If a range is provided in the BHP field, use the lower value. If only a single value is provided, estimate a reasonable minimum based on the vehicle type and max BHP. If not provided or cannot be determined, use 0.
minTorque: The minimum torque of the vehicle in Nm. If a range is provided in the Torque field, use the lower value. If only a single value is provided, estimate a reasonable minimum based on the vehicle type and max torque. If not provided or cannot be determined, use 0.
zeroTo100Kmph: Calculate the 0-100 km/h acceleration time in seconds based on the provided acceleration formula. If the acceleration is given as 0-60 mph, convert it to 0-100 km/h. If not provided or cannot be determined, use 0.
zeroTo60mph: Calculate the 0-60 mph acceleration time in seconds based on the provided acceleration formula. If the acceleration is given as 0-100 km/h, convert it to 0-60 mph. If not provided or cannot be determined, use 0.
Details: All biographical details you have about the vehicle itself, including any significant racing event history, media, merchandise, crashes & deaths, and any fun facts you know about the vehicle. Don't mention that it is a mod for a game, but you can mention the unique features that this mod contains.
Credits: any people or teams who were mentioned to help with the vehicle mod (list of features worked on by person or team)
Engine: The official naming of the engine installed into the vehicle. If you don't know, use the engine provided by the stock vehicle, or make a best guess. You must provide manufacturer name of the engine, the volume of the engine, and configuration, such as Inline-4, V6, V8, V12, W12, W16, W20, Straight-8, or whatever custom configuration it is in, and if it is turbocharged, mention that as well as ""Turbo"" or ""Turbocharged"" or ""Twin-Turbo"" or whatever the official naming they use for that engine.
Brakes: The manufacturer & type of brakes installed into the vehicle. If you don't know, use the brakes provided by the stock vehicle, or make a best guess.
Tires: The manufacturer & type of tires installed into the vehicle. If you don't know, use the tires provided by the stock vehicle, or make a best guess.
Suspension: The type of suspension installed into the vehicle. If you don't know, use the suspension provided by the stock vehicle, or make a best guess. Only include the abbreviation (DWB, AXLE, Strut), don't include the word ""suspension"", and if the vehicle uses a more complex suspension system, describe it in a few words less than 25 characters, and if the vehicle uses a separate suspension system for front & rear, name the suspension system for front & rear separately.
Seats: An integer representing the total seats available in the vehicle. take into account that the car my be modified for racing so the back seats might have been removed and replaced with NOS or empty space to make the vehicle lighter.
Driver Side: either left or right
Turbo: If a turbo system is installed in the vehicle, give the manufacturer name & type of turbo installed. If not, leave the field blank
Nitrous: If nitrous is available, give the brand name. If not, leave the field blank
Mod kit: If the vehicle is using a mod kit, provide the product name of the mod kit used. If not, leave the field blank
Team: Team name is typically provided as the first part of the car folder path name

#Rules#
* Separate paragraphs in the details property using two line breaks ""\\n\\n"".
* Only use the provided ""Available Types"" for the types array and don't use anything else. Same goes for Available Styles & Specializations. 
* Double check and make sure that the types array that you create only contains types that were provided in the list of Available Types.
* Don't use parenthesis information in the engine, brakes, tires, suspension, turbo, nitrous, or modkit fields
#Output#
You will output a JSON object (without comments) and nothing before or after the JSON object. Use the following template to output with:
{{
    ""name"": """",
    ""make"": """",
    ""model"": """",
    ""extra"": """",
    ""class"": """",
    ""country"": """",
    ""year"": ####,
    ""author"":"""",
    ""types"": [""""],
    ""styles"": [""""],
    ""specializations"": [""""],
    ""shortDescription"": """",
    ""minBHP"": #,
    ""minTorque"": #,
    ""zeroTo100Kmph"": #,
    ""zeroTo60mph"": #,
    ""details"": """",
    ""credits"": """",
    ""engine"":"""",
    ""brakes"":"""",
    ""tires"":"""",
    ""suspension"":"""",
    ""seats"":1,
    ""driverside"":""left"",
    ""turbo"":"""",
    ""nitrous"":"""",
    ""modkit"":"""",
    ""team"":""""
}};";

            //send prompt to preferred LLM
            AI_CarDetails carDetails = null;
            try
            {
                var response = await LLMs.Prompt(systemPrompt, "", carInfo);
                carDetails = JsonSerializer.Deserialize<AI_CarDetails>(response.Replace("json```", "").Replace("```json", "").Replace("```", ""));
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
                return;
            }

            if (carDetails != null)
            {
                //update car details from AI response
                if (string.IsNullOrEmpty(car.Name))
                {
                    try
                    {
                        car.Name = !string.IsNullOrEmpty(carDetails.Name) ? carDetails.Name :
                        (
                            car.Name != null && car.Name.IndexOf(carDetails.Make) == 1 ?
                            (carDetails.Make + " " + car.Name.Split(carDetails.Make, 2)[1].Trim()) :
                            (
                            carDetails.Make + " " + carDetails.Model + " " +
                            carDetails.Extra.Replace(carDetails.Make, "").Replace(carDetails.Model, "").Trim()
                        )
                    );
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (!car.Year.HasValue || car.Year == 0)
                {
                    try
                    {
                        if (carDetails.Year > 0)
                        {
                            car.Year = carDetails.Year;
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Country))
                {
                    try
                    {
                        car.Country = CountriesHelper.GetCountryCode(!string.IsNullOrEmpty(carDetails.Country) && carDetails.Country.Length > 2
                            ? carDetails.Country.Substring(0, 2)
                            : carDetails.Country);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.ShortDescription))
                {
                    try
                    {
                        car.ShortDescription = carDetails.ShortDescription;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Author))
                {
                    try
                    {
                        car.Author = !string.IsNullOrEmpty(car.Author) ? car.Author : carDetails.Author;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Class))
                {
                    try
                    {
                        var carClass = GetCarClass(
                            car.Name, 
                            car.Details, 
                            carDetails.Class,
                            carDetails.Year,
                            car.MaxBHP?.ToString() ?? "",
                            car.Weight?.ToString() ?? "",
                            "");
                        car.Class = carClass;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Details))
                {
                    try
                    {
                        car.Details = carDetails.Details;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Engine))
                {
                    try
                    {
                        car.Engine = carDetails.Engine.Split("(")[0].Trim();
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Brakes))
                {
                    try
                    {
                        car.Brakes = carDetails.Brakes.Split("(")[0].Trim();
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (!car.Seats.HasValue || car.Seats == 0)
                {
                    try
                    {
                        car.Seats = carDetails.Seats;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (!car.DriverSide.HasValue || car.DriverSide == 0)
                {
                    try
                    {
                        car.DriverSide = carDetails.DriverSide == "left" ? -1 : (carDetails.DriverSide == "right" ? 1 : 0);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Turbo))
                {
                    try
                    {
                        car.Turbo = carDetails.Turbo.Split("(")[0].Trim();
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Nitrous))
                {
                    try
                    {
                        car.Nitrous = carDetails.Nitrous.Split("(")[0].Trim();
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Modkit))
                {
                    try
                    {
                        car.Modkit = carDetails.ModKit.Split("(")[0].Trim();
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Credits))
                {
                    try
                    {
                        car.Credits = carDetails.Credits;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Tires))
                {
                    try
                    {
                        car.Tires = carDetails.Tires.Split("(")[0].Trim();
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (string.IsNullOrEmpty(car.Suspension))
                {
                    try
                    {
                        car.Suspension = carDetails.Suspension.Split("(")[0].Trim();
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (carDetails.MinBHP.HasValue && (!car.MinBHP.HasValue || car.MinBHP == 0))
                {
                    try
                    {
                        car.MinBHP = carDetails.MinBHP;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (carDetails.MinTorque.HasValue && (!car.MinTorque.HasValue || car.MinTorque == 0))
                {
                    try
                    {
                        car.MinTorque = carDetails.MinTorque;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (carDetails.ZeroTo100Kmph.HasValue && (!car.ZeroTo100kmph.HasValue || car.ZeroTo100kmph == 0))
                {
                    try
                    {
                        car.ZeroTo100kmph = carDetails.ZeroTo100Kmph;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
                if (carDetails.ZeroTo60mph.HasValue && (!car.ZeroTo60mph.HasValue || car.ZeroTo60mph == 0))
                {
                    try
                    {
                        car.ZeroTo60mph = carDetails.ZeroTo60mph;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }

                car.IsNew = false;

                //find or create make
                if (!string.IsNullOrEmpty(carDetails.Make))
                {
                    try
                    {
                        var make = SQL.CarMakesRepository.GetByName(carDetails.Make);
                        if (make == null)
                        {
                            make = new Entities.CarMake { Name = carDetails.Make };
                            var countryData = GetCarCountry(carDetails.Make);
                            if (!string.IsNullOrEmpty(countryData.CountryCode))
                            {
                                make.CountryCode = countryData.CountryCode;
                            }
                            make.Id = SQL.CarMakesRepository.Add(make);
                        }
                        car.MakeId = make.Id;

                        // Update car country if available from make
                        if (!string.IsNullOrEmpty(make.CountryCode) && string.IsNullOrEmpty(car.Country))
                        {
                            car.Country = make.CountryCode;
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }

                //find or create model
                if (!string.IsNullOrEmpty(carDetails.Model))
                {
                    try
                    {
                        var model = SQL.CarModelsRepository.GetByName(carDetails.Model);
                        if (model == null)
                        {
                            model = new CarModel
                            {
                                Name = carDetails.Model,
                                MakeId = car.MakeId.Value
                            };
                            model.Id = SQL.CarModelsRepository.Add(model);
                        }
                        car.ModelId = model.Id;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }

                //find or create country
                if (!string.IsNullOrEmpty(carDetails.Country))
                {
                    try
                    {
                        var country = SQL.CountryRepository.FindOrCreate(carDetails.Country, "");
                        if (country != null)
                        {
                            car.Country = country.Name;
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }


                //add types
                if (carDetails.Types != null && carDetails.Types.Count > 0)
                {
                    try
                    {
                        var typeIds = new List<int>();
                        foreach (var typeName in carDetails.Types)
                        {
                            var type = SQL.CarTypesRepository.GetByName(typeName);
                            if (type != null)
                            {
                                typeIds.Add(type.Id);
                            }
                        }
                        SQL.CarTypeMappingRepository.SetForCar(car.Id, typeIds);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }

                //add stylings
                if (carDetails.Styles != null && carDetails.Styles.Count > 0)
                {
                    try
                    {
                        var styleIds = new List<int>();
                        foreach (var styleName in carDetails.Styles)
                        {
                            var style = SQL.CarStylingRepository.GetByName(styleName);
                            if (style != null)
                            {
                                styleIds.Add(style.Id);
                            }
                        }
                        SQL.CarStylingMappingRepository.SetForCar(car.Id, styleIds);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }

                //add specializations
                if (carDetails.Specializations != null && carDetails.Specializations.Count > 0)
                {
                    try
                    {
                        var specializationIds = new List<int>();
                        foreach (var specializationName in carDetails.Specializations)
                        {
                            var specialization = SQL.RacingSpecializationsRepository.GetByName(specializationName);
                            if (specialization != null)
                            {
                                specializationIds.Add(specialization.Id);
                            }
                        }
                        SQL.CarSpecializationsRepository.SetForCar(car.Id, specializationIds);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Error: " + ex.Message);
                    }
                }
            }
        }
    }
}
