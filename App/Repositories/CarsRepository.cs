using Dapper;
using RacerUI.Entities;
using RacerUI.Models;

namespace RacerUI.SQL
{
    public static class CarsRepository
    {
        /// <summary>
        /// Adds a new car to the database
        /// </summary>
        /// <param name="car">The car entity to add</param>
        /// <returns>The ID of the newly added car</returns>
        public static int Add(Car car)
        {
            const string sql = @"
                INSERT INTO Cars (
                    ParentId, GameId, Year, MakeId, ModelId, Name, TeamId, Path, 
                    ShortDescription, Author, Class, MinBHP, MaxBHP, MinTorque, MaxTorque, 
                    Weight, MaxSpeed, ZeroTo100kmph, ZeroTo60mph, PWRatioKgPerHp, 
                    Status, Rating, PowerCurve, TorqueCurve, Notes, Details, Engine, Brakes, Seats, DriverSide, Turbo, Nitrous, Modkit, Credits, Tires, Suspension, Country, 
                    Gears, Shifter, AutoClutch, MaxRPM, LimitRPM, MaxFuel, KPL, DriveType
                ) VALUES (
                    @ParentId, @GameId, @Year, @MakeId, @ModelId, @Name, @TeamId, @Path, 
                    @ShortDescription, @Author, @Class, @MinBHP, @MaxBHP, @MinTorque, @MaxTorque, 
                    @Weight, @MaxSpeed, @ZeroTo100kmph, @ZeroTo60mph, @PWRatioKgPerHp, 
                    @Status, @Rating, @PowerCurve, @TorqueCurve, @Notes, @Details, @Engine, @Brakes, @Seats, @DriverSide, @Turbo, @Nitrous, @Modkit, @Credits, @Tires, @Suspension, @Country, 
                    @Gears, @Shifter, @AutoClutch, @MaxRPM, @LimitRPM, @MaxFuel, @KPL, @DriveType
                );
                SELECT last_insert_rowid();";

            int carId;
            using (var connection = Connection.GetConnection())
            {
                carId = connection.ExecuteScalar<int>(sql, car);
            }

            // Add skins if they exist
            if (car.Skins != null && car.Skins.Count > 0)
            {
                foreach (var skin in car.Skins)
                {
                    skin.CarId = carId;
                    var skinId = CarSkinsRepository.Add(skin);
                    if (skin.Drivers != null && skin.Drivers.Count > 0)
                    {
                        CarDriversRepository.DeleteBySkinId(skinId); //reset list of drivers for skin
                        foreach (var driver in skin.Drivers)
                        {
                            CarDriversRepository.Add(new CarDriver()
                            {
                                CarId = carId,
                                DriverId = driver.Id,
                                SkinId = skinId
                            });
                        }
                    }
                }
            }

            // Add stylings if they exist
            if (car.Stylings != null && car.Stylings.Count > 0)
            {
                foreach (var styling in car.Stylings)
                {
                    styling.CarId = carId;
                    CarStylingRepository.Add(styling);
                }
            }

            // Add tags if they exist
            if (car.Tags != null && car.Tags.Count > 0)
            {
                foreach (var tag in car.Tags)
                {
                    tag.CarId = carId;
                    CarTagsRepository.Add(tag);
                }
            }

            // Add types if they exist
            if (car.Types != null && car.Types.Count > 0)
            {
                foreach (var type in car.Types)
                {
                    type.CarId = carId;
                    CarTypesRepository.Add(type);
                }
            }

            // Add specializations if they exist
            if (car.Specializations != null && car.Specializations.Count > 0)
            {
                foreach (var specialization in car.Specializations)
                {
                    CarSpecializationsRepository.Associate(car.Id, specialization.SpecializationId);
                }
            }

            return carId;
        }

        

        /// <summary>
        /// Updates all fields of a car
        /// </summary>
        /// <param name="car">The car entity with updated values</param>
        /// <returns>True if the update was successful</returns>
        public static bool Update(Car car)
        {
            const string sql = @"
                UPDATE Cars SET 
                    ParentId = @ParentId,
                    GameId = @GameId,
                    Year = @Year,
                    MakeId = @MakeId,
                    ModelId = @ModelId,
                    Name = @Name,
                    TeamId = @TeamId,
                    Path = @Path,
                    ShortDescription = @ShortDescription,
                    Author = @Author,
                    Class = @Class,
                    MinBHP = @MinBHP,
                    MaxBHP = @MaxBHP,
                    MinTorque = @MinTorque,
                    MaxTorque = @MaxTorque,
                    Weight = @Weight,
                    MaxSpeed = @MaxSpeed,
                    ZeroTo100kmph = @ZeroTo100kmph,
                    ZeroTo60mph = @ZeroTo60mph,
                    PWRatioKgPerHp = @PWRatioKgPerHp,
                    Status = @Status,
                    IsNew = @IsNew,
                    Rating = @Rating,
                    PowerCurve = @PowerCurve,
                    TorqueCurve = @TorqueCurve,
                    Notes = @Notes,
                    Details = @Details,
                    Engine = @Engine,
                    Brakes = @Brakes,
                    Seats = @Seats,
                    DriverSide = @DriverSide,
                    Turbo = @Turbo,
                    Nitrous = @Nitrous,
                    Modkit = @Modkit,
                    Credits = @Credits,
                    Tires = @Tires,
                    Suspension = @Suspension,
                    Country = @Country,
                    Gears = @Gears,
                    Shifter = @Shifter,
                    AutoClutch = @AutoClutch,
                    MaxRPM = @MaxRPM,
                    LimitRPM = @LimitRPM,
                    MaxFuel = @MaxFuel,
                    KPL = @KPL,
                    DriveType = @DriveType
                WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, car) > 0;
            }
        }

        /// <summary>
        /// Updates only the Notes field of a car
        /// </summary>
        /// <param name="id">The ID of the car to update</param>
        /// <param name="notes">The new notes value</param>
        /// <returns>True if the update was successful</returns>
        public static bool UpdateNotes(int id, string notes)
        {
            const string sql = "UPDATE Cars SET Notes = @Notes WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id, Notes = notes }) > 0;
            }
        }

        /// <summary>
        /// Updates only the Rating field of a car
        /// </summary>
        /// <param name="id">The ID of the car to update</param>
        /// <param name="rating">The new rating value</param>
        /// <returns>True if the update was successful</returns>
        public static bool UpdateRating(int id, int? rating)
        {
            const string sql = "UPDATE Cars SET Rating = @Rating WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id, Rating = rating }) > 0;
            }
        }

        /// <summary>
        /// Updates only the Status field of a car
        /// </summary>
        /// <param name="id">The ID of the car to update</param>
        /// <param name="status">The new status value</param>
        /// <returns>True if the update was successful</returns>
        public static bool UpdateStatus(int id, int status)
        {
            const string sql = "UPDATE Cars SET Status = @Status WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id, Status = status }) > 0;
            }
        }

        /// <summary>
        /// Updates only the IsNew field of a car
        /// </summary>
        /// <param name="id">The ID of the car to update</param>
        /// <param name="isNew">The new IsNew value</param>
        /// <returns>True if the update was successful</returns>
        public static bool UpdateIsNew(int id, int isNew)
        {
            const string sql = "UPDATE Cars SET IsNew = @IsNew WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id, IsNew = isNew }) > 0;
            }
        }

        /// <summary>
        /// Updates only the Class field of a car
        /// </summary>
        /// <param name="id">The ID of the car to update</param>
        /// <param name="carClass">The new class value</param>
        /// <returns>True if the update was successful</returns>
        public static bool UpdateClass(int id, string carClass)
        {
            const string sql = "UPDATE Cars SET Class = @Class WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id, Class = carClass }) > 0;
            }
        }

        /// <summary>
        /// Updates only the Year field of a car
        /// </summary>
        /// <param name="id">The ID of the car to update</param>
        /// <param name="year">The new year value</param>
        /// <returns>True if the update was successful</returns>
        public static bool UpdateYear(int id, int? year)
        {
            const string sql = "UPDATE Cars SET Year = @Year WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id, Year = year }) > 0;
            }
        }

        /// <summary>
        /// Updates only the Name field of a car
        /// </summary>
        /// <param name="id">The ID of the car to update</param>
        /// <param name="name">The new name value</param>
        /// <returns>True if the update was successful</returns>
        public static bool UpdateName(int id, string name)
        {
            const string sql = "UPDATE Cars SET Name = @Name WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id, Name = name }) > 0;
            }
        }

        /// <summary>
        /// Updates only the Version field of a car
        /// </summary>
        /// <param name="id">The ID of the car to update</param>
        /// <param name="version">The new version value</param>
        /// <returns>True if the update was successful</returns>
        public static bool UpdateVersion(int id, string version)
        {
            const string sql = "UPDATE Cars SET Version = @Version WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id, Version = version }) > 0;
            }
        }

        /// <summary>
        /// Updates only the MakeId field of a car
        /// </summary>
        /// <param name="id">The ID of the car to update</param>
        /// <param name="makeId">The new make ID value</param>
        /// <returns>True if the update was successful</returns>
        public static bool UpdateMakeId(int id, int? makeId)
        {
            const string sql = "UPDATE Cars SET MakeId = @MakeId WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id, MakeId = makeId }) > 0;
            }
        }

        /// <summary>
        /// Updates only the ModelId field of a car
        /// </summary>
        /// <param name="id">The ID of the car to update</param>
        /// <param name="modelId">The new model ID value</param>
        /// <returns>True if the update was successful</returns>
        public static bool UpdateModelId(int id, int? modelId)
        {
            const string sql = "UPDATE Cars SET ModelId = @ModelId WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id, ModelId = modelId }) > 0;
            }
        }

        /// <summary>
        /// Updates only the Country field of a car
        /// </summary>
        /// <param name="id">The ID of the car to update</param>
        /// <param name="country">The new country code value</param>
        /// <returns>True if the update was successful</returns>
        public static bool UpdateCountry(int id, string country)
        {
            const string sql = "UPDATE Cars SET Country = @Country WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.Execute(sql, new { Id = id, Country = country }) > 0;
            }
        }

        /// <summary>
        /// Gets a car by its ID
        /// </summary>
        /// <param name="id">The ID of the car to retrieve</param>
        /// <returns>The car entity if found, null otherwise</returns>
        public static Car GetById(int id)
        {
            const string sql = "SELECT * FROM Cars WHERE Id = @Id";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<Car>(sql, new { Id = id });
            }
        }

        /// <summary>
        /// Gets a car with all its related data
        /// </summary>
        /// <param name="id">The ID of the car to retrieve</param>
        /// <returns>The car entity with all its related data</returns>
        public static Car GetDetails(int id)
        {
            const string sql = @"
                SELECT * FROM Cars WHERE Id = @Id;

                SELECT s.*
                FROM Cars_Skins s
                WHERE s.CarId = @Id;

                -- Get all drivers associated with each skin through the Cars_Drivers table
                SELECT d.*, cd.SkinId
                FROM Drivers d
                JOIN Cars_Drivers cd ON d.Id = cd.DriverId
                WHERE cd.CarId = @Id;

                SELECT rs.*, cs.SpecializationId
                FROM RacingSpecializations rs
                JOIN Cars_Specializations cs ON rs.Id = cs.SpecializationId
                WHERE cs.CarId = @Id;

                SELECT cs.*, cst.StylingId
                FROM CarStyling cs
                JOIN Cars_Styling cst ON cs.Id = cst.StylingId
                WHERE cst.CarId = @Id;

                SELECT ct.*, cta.TagId
                FROM CarTags ct
                JOIN Cars_Tags cta ON ct.Id = cta.TagId
                WHERE cta.CarId = @Id;

                SELECT cty.*, ct.TypeId
                FROM CarTypes cty
                JOIN Cars_Types ct ON cty.Id = ct.TypeId
                WHERE ct.CarId = @Id;";

            using (var connection = Connection.GetConnection())
            {
                using (var multi = connection.QueryMultiple(sql, new { Id = id }))
                {
                    var car = multi.Read<Car>().FirstOrDefault();

                    if (car != null)
                    {
                        car.Skins = multi.Read<CarSkin>().ToList();

                        // Read drivers with their associated skin IDs
                        var driversWithSkinIds = multi.Read<dynamic>().ToList();

                        // Initialize Drivers list for each skin
                        foreach (var skin in car.Skins)
                        {
                            skin.Drivers = new List<Driver>();
                        }

                        // Assign drivers to their respective skins
                        foreach (var item in driversWithSkinIds)
                        {
                            var skinId = (int)item.SkinId;
                            var driver = new Driver
                            {
                                Id = item.Id,
                                Name = item.Name,
                                // Add other driver properties as needed
                            };

                            var skin = car.Skins.FirstOrDefault(s => s.Id == skinId);
                            if (skin != null)
                            {
                                skin.Drivers.Add(driver);
                            }
                        }

                        car.Specializations = multi.Read<CarSpecialization>().ToList();
                        car.Stylings = multi.Read<CarStyling>().ToList();
                        car.Tags = multi.Read<CarTag>().ToList();
                        car.Types = multi.Read<CarType>().ToList();
                    }

                    return car;
                }
            }
        }

        /// <summary>
        /// Gets a car by its Path
        /// </summary>
        /// <param name="path">The Path of the car to retrieve</param>
        /// <returns>The car entity if found, null otherwise</returns>
        public static Car GetByPath(string path)
        {
            const string sql = "SELECT * FROM Cars WHERE Path = @Path";

            using (var connection = Connection.GetConnection())
            {
                return connection.QuerySingleOrDefault<Car>(sql, new { Path = path });
            }
        }

        /// <summary>
        /// Gets a list of all cars with only their Id and Path properties populated.
        /// </summary>
        /// <returns>A list of cars with Id and Path.</returns>
        public static IEnumerable<Car> GetAllCarPaths()
        {
            const string sql = "SELECT Id, ParentId, GameId, MakeId, Path, IsNew, Status, Country, Year FROM Cars ORDER BY Path;";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<Car>(sql);
            }
        }

        /// <summary>
        /// Gets all distinct country codes from the Cars table.
        /// </summary>
        /// <returns>A list of distinct country codes.</returns>
        public static IEnumerable<string> GetDistinctCountries()
        {
            const string sql = "SELECT DISTINCT Country FROM Cars WHERE Country IS NOT NULL AND Country != '' ORDER BY Country;";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<string>(sql);
            }
        }

        /// <summary>
        /// Gets all distinct years from the Cars table.
        /// </summary>
        /// <returns>A list of distinct years.</returns>
        public static IEnumerable<int> GetDistinctYears()
        {
            const string sql = "SELECT DISTINCT Year FROM Cars WHERE Year IS NOT NULL ORDER BY Year DESC;";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<int>(sql);
            }
        }

        /// <summary>
        /// Gets all car makes (manufacturers) from the CarMakes table.
        /// </summary>
        /// <returns>A list of car makes with Id and Name.</returns>
        public static IEnumerable<dynamic> GetAllMakes()
        {
            const string sql = "SELECT Id, Name FROM CarMakes ORDER BY Name;";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query(sql);
            }
        }

        /// <summary>
        /// Gets all car types from the CarTypes table.
        /// </summary>
        /// <returns>A list of car types with Id and Name.</returns>
        public static IEnumerable<dynamic> GetAllTypes()
        {
            const string sql = "SELECT Id, Name FROM CarTypes ORDER BY Name;";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query(sql);
            }
        }

        /// <summary>
        /// Gets all car stylings from the CarStyling table.
        /// </summary>
        /// <returns>A list of car stylings with Id and Name.</returns>
        public static IEnumerable<dynamic> GetAllStyles()
        {
            const string sql = "SELECT Id, Name FROM CarStyling ORDER BY Name;";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query(sql);
            }
        }

        /// <summary>
        /// Gets all racing specializations from the RacingSpecializations table.
        /// </summary>
        /// <returns>A list of racing specializations with Id and Name.</returns>
        public static IEnumerable<dynamic> GetAllSpecializations()
        {
            const string sql = "SELECT Id, Name FROM RacingSpecializations ORDER BY Name;";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query(sql);
            }
        }

        /// <summary>
        /// Finds child cars for a given parent car based on path prefix and updates their ParentId.
        /// </summary>
        /// <param name="car">The parent car entity, must have Id and Path.</param>
        /// <returns>A list of child cars found and updated.</returns>
        public static IEnumerable<Car> FindChildren(Car car)
        {
            const string findSql = @"
                SELECT Id, Path FROM Cars 
                WHERE Path LIKE @PathPrefix AND Path != @Path AND ParentId IS NULL;";

            using (var connection = Connection.GetConnection())
            {
                var children = connection.Query<Car>(findSql, new { PathPrefix = car.Path + '%', car.Path }).ToList();

                if (children.Count > 0)
                {
                    var childIds = children.Select(c => c.Id).ToList();
                    const string updateSql = "UPDATE Cars SET ParentId = @ParentId WHERE Id IN @ChildIds;";
                    connection.Execute(updateSql, new { ParentId = car.Id, ChildIds = childIds });
                }

                return children;
            }
        }

        /// <summary>
        /// Gets the count of cars matching the specified filter criteria without loading car data.
        /// </summary>
        /// <param name="countryCodes">Array of country codes to filter by (e.g., "US", "DE", "JP"). Pass null or empty to skip this filter.</param>
        /// <param name="makeIds">Array of manufacturer IDs to filter by. Pass null or empty to skip this filter.</param>
        /// <param name="years">Array of years to filter by. Pass null or empty to skip this filter.</param>
        /// <param name="classes">Array of car class names to filter by. Pass null or empty to skip this filter.</param>
        /// <param name="typeIds">Array of car type IDs to filter by. Pass null or empty to skip this filter.</param>
        /// <param name="styleIds">Array of car styling IDs to filter by. Pass null or empty to skip this filter.</param>
        /// <param name="specializationIds">Array of racing specialization IDs to filter by. Pass null or empty to skip this filter.</param>
        /// <param name="searchText">Plain text search to filter by car name. Pass null or empty to skip this filter.</param>
        /// <returns>The count of cars matching all specified filter criteria.</returns>
        public static int FilterCount(
            IEnumerable<string> countryCodes = null,
            IEnumerable<int> makeIds = null,
            IEnumerable<int> years = null,
            IEnumerable<string> classes = null,
            IEnumerable<int> typeIds = null,
            IEnumerable<int> styleIds = null,
            IEnumerable<int> specializationIds = null,
            string searchText = null)
        {
            var sql = "SELECT COUNT(*) FROM Cars c";
            var parameters = new DynamicParameters();
            var whereClauses = new List<string>();
            var joins = new List<string>();

            // Type filter (requires join to Cars_Types)
            if (typeIds != null && typeIds.Any())
            {
                joins.Add("INNER JOIN Cars_Types ct ON c.Id = ct.CarId");
                whereClauses.Add("ct.TypeId IN @TypeIds");
                parameters.Add("TypeIds", typeIds.ToList());
            }

            // Style filter (requires join to Cars_Styling)
            if (styleIds != null && styleIds.Any())
            {
                joins.Add("INNER JOIN Cars_Styling cs ON c.Id = cs.CarId");
                whereClauses.Add("cs.StylingId IN @StyleIds");
                parameters.Add("StyleIds", styleIds.ToList());
            }

            // Specialization filter (requires join to Cars_Specializations)
            if (specializationIds != null && specializationIds.Any())
            {
                joins.Add("INNER JOIN Cars_Specializations csp ON c.Id = csp.CarId");
                whereClauses.Add("csp.SpecializationId IN @SpecializationIds");
                parameters.Add("SpecializationIds", specializationIds.ToList());
            }

            // Add joins to SQL
            if (joins.Any())
            {
                sql += " " + string.Join(" ", joins);
            }

            // Country filter
            if (countryCodes != null && countryCodes.Any())
            {
                whereClauses.Add("c.Country IN @CountryCodes");
                parameters.Add("CountryCodes", countryCodes.ToList());
            }

            // Manufacturer filter
            if (makeIds != null && makeIds.Any())
            {
                whereClauses.Add("c.MakeId IN @MakeIds");
                parameters.Add("MakeIds", makeIds.ToList());
            }

            // Year filter
            if (years != null && years.Any())
            {
                whereClauses.Add("c.Year IN @Years");
                parameters.Add("Years", years.ToList());
            }

            // Class filter
            if (classes != null && classes.Any())
            {
                whereClauses.Add("c.Class IN @Classes");
                parameters.Add("Classes", classes.ToList());
            }

            // Text search filter
            if (!string.IsNullOrWhiteSpace(searchText))
            {
                whereClauses.Add("c.Name LIKE @SearchText");
                parameters.Add("SearchText", $"%{searchText}%");
            }

            // Always exclude cars with null/invalid name or year
            whereClauses.Add("c.Name IS NOT NULL");
            whereClauses.Add("c.Year IS NOT NULL");
            whereClauses.Add("c.Year > 0");

            // Add WHERE clause (always has at least the validation clauses)
            sql += " WHERE " + string.Join(" AND ", whereClauses);

            using (var connection = Connection.GetConnection())
            {
                return connection.ExecuteScalar<int>(sql, parameters);
            }
        }

        /// <summary>
        /// Filters cars based on multiple criteria including countries, manufacturers, years, classes, types, styles, specializations, and text search.
        /// </summary>
        /// <param name="countryCodes">Array of country codes to filter by (e.g., "US", "DE", "JP"). Pass null or empty to skip this filter.</param>
        /// <param name="makeIds">Array of manufacturer IDs to filter by. Pass null or empty to skip this filter.</param>
        /// <param name="years">Array of years to filter by. Pass null or empty to skip this filter.</param>
        /// <param name="classes">Array of car class names to filter by. Pass null or empty to skip this filter.</param>
        /// <param name="typeIds">Array of car type IDs to filter by. Pass null or empty to skip this filter.</param>
        /// <param name="styleIds">Array of car styling IDs to filter by. Pass null or empty to skip this filter.</param>
        /// <param name="specializationIds">Array of racing specialization IDs to filter by. Pass null or empty to skip this filter.</param>
        /// <param name="searchText">Plain text search to filter by car name. Pass null or empty to skip this filter.</param>
        /// <param name="start">Starting index for pagination. Pass null to skip pagination.</param>
        /// <param name="length">Number of records to return for pagination. Pass null to skip pagination.</param>
        /// <returns>A list of cars matching all specified filter criteria.</returns>
        public static IEnumerable<Car> Filter(
            IEnumerable<string> countryCodes = null,
            IEnumerable<int> makeIds = null,
            IEnumerable<int> years = null,
            IEnumerable<string> classes = null,
            IEnumerable<int> typeIds = null,
            IEnumerable<int> styleIds = null,
            IEnumerable<int> specializationIds = null,
            string searchText = null,
            int? start = null,
            int? length = null)
        {
            var sql = "SELECT c.*, m.Name as MakeName FROM Cars c";
            var parameters = new DynamicParameters();
            var whereClauses = new List<string>();
            var joins = new List<string>();
            
            // Always LEFT JOIN CarMakes to get make name
            joins.Add("LEFT JOIN CarMakes m ON c.MakeId = m.Id");

            // Type filter (requires join to Cars_Types)
            if (typeIds != null && typeIds.Any())
            {
                joins.Add("INNER JOIN Cars_Types ct ON c.Id = ct.CarId");
                whereClauses.Add("ct.TypeId IN @TypeIds");
                parameters.Add("TypeIds", typeIds.ToList());
            }

            // Style filter (requires join to Cars_Styling)
            if (styleIds != null && styleIds.Any())
            {
                joins.Add("INNER JOIN Cars_Styling cs ON c.Id = cs.CarId");
                whereClauses.Add("cs.StylingId IN @StyleIds");
                parameters.Add("StyleIds", styleIds.ToList());
            }

            // Specialization filter (requires join to Cars_Specializations)
            if (specializationIds != null && specializationIds.Any())
            {
                joins.Add("INNER JOIN Cars_Specializations csp ON c.Id = csp.CarId");
                whereClauses.Add("csp.SpecializationId IN @SpecializationIds");
                parameters.Add("SpecializationIds", specializationIds.ToList());
            }

            // Add joins to SQL
            if (joins.Any())
            {
                sql += " " + string.Join(" ", joins);
            }

            // Country filter
            if (countryCodes != null && countryCodes.Any())
            {
                whereClauses.Add("c.Country IN @CountryCodes");
                parameters.Add("CountryCodes", countryCodes.ToList());
            }

            // Manufacturer filter
            if (makeIds != null && makeIds.Any())
            {
                whereClauses.Add("c.MakeId IN @MakeIds");
                parameters.Add("MakeIds", makeIds.ToList());
            }

            // Year filter
            if (years != null && years.Any())
            {
                whereClauses.Add("c.Year IN @Years");
                parameters.Add("Years", years.ToList());
            }

            // Class filter
            if (classes != null && classes.Any())
            {
                whereClauses.Add("c.Class IN @Classes");
                parameters.Add("Classes", classes.ToList());
            }

            // Text search filter
            if (!string.IsNullOrWhiteSpace(searchText))
            {
                whereClauses.Add("c.Name LIKE @SearchText");
                parameters.Add("SearchText", $"%{searchText}%");
            }

            // Always exclude cars with null/invalid name or year
            whereClauses.Add("c.Name IS NOT NULL");
            whereClauses.Add("c.Year IS NOT NULL");
            whereClauses.Add("c.Year > 0");

            // Add WHERE clause (always has at least the validation clauses)
            sql += " WHERE " + string.Join(" AND ", whereClauses);

            sql += " ORDER BY c.Name";

            // Add pagination if both start and length are provided
            if (start.HasValue && length.HasValue)
            {
                sql += " LIMIT @Length OFFSET @Start";
                parameters.Add("Start", start.Value);
                parameters.Add("Length", length.Value);
            }

            using (var connection = Connection.GetConnection())
            {
                var cars = connection.Query<Car>(sql, parameters).ToList();
                
                // Load all skins for each car
                if (cars.Any())
                {
                    var carIds = cars.Select(c => c.Id).ToList();
                    var skinsSql = @"
                        SELECT s.* 
                        FROM Cars_Skins s
                        WHERE s.CarId IN @CarIds
                        ORDER BY s.CarId, s.Id";
                    
                    var skins = connection.Query<CarSkin>(skinsSql, new { CarIds = carIds }).ToList();
                    
                    // Attach skins to cars
                    foreach (var car in cars)
                    {
                        car.Skins = skins.Where(s => s.CarId == car.Id).ToList();
                    }
                }
                
                return cars;
            }
        }
    }
}
