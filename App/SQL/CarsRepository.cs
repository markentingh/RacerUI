using Dapper;
using RacerUI.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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
                    Status, Rating, PowerGraph, TorqueGraph, Notes, Biography, Drivers
                ) VALUES (
                    @ParentId, @GameId, @Year, @MakeId, @ModelId, @Name, @TeamId, @Path, 
                    @ShortDescription, @Author, @Class, @MinBHP, @MaxBHP, @MinTorque, @MaxTorque, 
                    @Weight, @MaxSpeed, @ZeroTo100kmph, @ZeroTo60mph, @PWRatioKgPerHp, 
                    @Status, @Rating, @PowerGraph, @TorqueGraph, @Notes, @Biography, @Drivers
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
        /// Filters cars based on various criteria
        /// </summary>
        /// <param name="gameId">Optional game ID filter</param>
        /// <param name="make">Optional make filter</param>
        /// <param name="model">Optional model filter</param>
        /// <param name="year">Optional year filter</param>
        /// <param name="status">Optional status filter</param>
        /// <param name="minRating">Optional minimum rating filter</param>
        /// <param name="class">Optional class filter</param>
        /// <returns>A list of cars matching the filter criteria</returns>
        public static IEnumerable<Car> Filter(
            int? gameId = null,
            string make = null,
            string model = null,
            int? year = null,
            int? status = null,
            int? minRating = null,
            string carClass = null)
        {
            var conditions = new List<string>();
            var parameters = new DynamicParameters();

            if (gameId.HasValue)
            {
                conditions.Add("GameId = @GameId");
                parameters.Add("GameId", gameId.Value);
            }

            if (!string.IsNullOrEmpty(make))
            {
                conditions.Add("Make LIKE @Make");
                parameters.Add("Make", $"%{make}%");
            }

            if (!string.IsNullOrEmpty(model))
            {
                conditions.Add("Model LIKE @Model");
                parameters.Add("Model", $"%{model}%");
            }

            if (year.HasValue)
            {
                conditions.Add("Year = @Year");
                parameters.Add("Year", year.Value);
            }

            if (status.HasValue)
            {
                conditions.Add("Status = @Status");
                parameters.Add("Status", status.Value);
            }

            if (minRating.HasValue)
            {
                conditions.Add("Rating >= @MinRating");
                parameters.Add("MinRating", minRating.Value);
            }

            if (!string.IsNullOrEmpty(carClass))
            {
                conditions.Add("Class LIKE @Class");
                parameters.Add("Class", $"%{carClass}%");
            }

            var whereClause = conditions.Count > 0
                ? $"WHERE {string.Join(" AND ", conditions)}"
                : string.Empty;

            var sql = $"SELECT * FROM Cars {whereClause} ORDER BY Make, Model, Year";

            using (var connection = Connection.GetConnection())
            {
                return connection.Query<Car>(sql, parameters);
            }
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
                    Rating = @Rating,
                    PowerGraph = @PowerGraph,
                    TorqueGraph = @TorqueGraph,
                    Notes = @Notes,
                    Biography = @Biography,
                    Drivers = @Drivers
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
        /// Advanced filtering of cars based on multiple criteria with pagination support
        /// </summary>
        /// <param name="filter">The filter entity containing all filter criteria including pagination parameters</param>
        /// <returns>A list of cars matching the filter criteria with pagination applied</returns>
        public static IEnumerable<Car> AdvancedFilter(CarFilter filter)
        {
            var conditions = new List<string>();
            var parameters = new DynamicParameters();

            // Base query to get all cars with their related data
            var carsSql = @"
            SELECT c.* FROM Cars c
            LEFT JOIN CarMakes m ON c.MakeId = m.Id
            LEFT JOIN CarModels mdl ON c.ModelId = mdl.Id";

            // Add conditions for each filter parameter
            if (filter.Countries != null && filter.Countries.Count > 0)
            {
                conditions.Add("m.CountryCode IN @Countries");
                parameters.Add("Countries", filter.Countries);
            }

            if (filter.Makes != null && filter.Makes.Count > 0)
            {
                conditions.Add("c.MakeId IN @Makes");
                parameters.Add("Makes", filter.Makes);
            }

            if (filter.Models != null && filter.Models.Count > 0)
            {
                conditions.Add("c.ModelId IN @Models");
                parameters.Add("Models", filter.Models);
            }

            if (filter.Years != null && filter.Years.Count > 0)
            {
                conditions.Add("c.Year IN @Years");
                parameters.Add("Years", filter.Years);
            }

            // Handle types - requires subquery or join
            if (filter.Types != null && filter.Types.Count > 0)
            {
                carsSql += @" 
            LEFT JOIN (
                SELECT ct.CarId 
                FROM Cars_Types ct 
                WHERE ct.TypeId IN @Types
                GROUP BY ct.CarId
            ) types ON c.Id = types.CarId";

                conditions.Add("types.CarId IS NOT NULL");
                parameters.Add("Types", filter.Types);
            }

            // Handle styles - requires subquery or join
            if (filter.Styles != null && filter.Styles.Count > 0)
            {
                carsSql += @" 
            LEFT JOIN (
                SELECT cs.CarId 
                FROM Cars_Styling cs 
                WHERE cs.StylingId IN @Styles
                GROUP BY cs.CarId
            ) styles ON c.Id = styles.CarId";

                conditions.Add("styles.CarId IS NOT NULL");
                parameters.Add("Styles", filter.Styles);
            }

            // Handle specializations - requires subquery or join
            if (filter.Specializations != null && filter.Specializations.Count > 0)
            {
                carsSql += @" 
            LEFT JOIN (
                SELECT cs.CarId 
                FROM Cars_Specializations cs 
                WHERE cs.SpecializationId IN @Specializations
                GROUP BY cs.CarId
            ) specs ON c.Id = specs.CarId";

                conditions.Add("specs.CarId IS NOT NULL");
                parameters.Add("Specializations", filter.Specializations);
            }

            // Handle text search
            if (!string.IsNullOrEmpty(filter.Search))
            {
                conditions.Add(@"(
                c.Name LIKE @SearchTerm OR 
                c.ShortDescription LIKE @SearchTerm OR 
                c.Author LIKE @SearchTerm OR 
                m.Name LIKE @SearchTerm OR 
                mdl.Name LIKE @SearchTerm
            )");
                parameters.Add("SearchTerm", $"%{filter.Search}%");
            }

            if(filter.HasSkins == true)
            {
                conditions.Add(@"EXISTS(SELECT 1 FROM Cars_Skins WHERE CarId=c.Id)");
            }

            // Create a base filtered cars query with WHERE clause
            var filteredCarsSql = carsSql;
            if (conditions.Count > 0)
            {
                filteredCarsSql += " WHERE " + string.Join(" AND ", conditions);
            }

            // Create a filtered car IDs query for use in related queries
            var filteredCarIdsSql = "SELECT c.Id FROM (" + filteredCarsSql + ") c";

            // Complete the cars query with ORDER BY and pagination
            var completedCarsSql = filteredCarsSql + " ORDER BY m.Name, mdl.Name, c.Year";
            
            // Add pagination if specified
            if (filter.Start.HasValue && filter.Length.HasValue)
            {
                completedCarsSql += " LIMIT @Length OFFSET @Start";
                parameters.Add("Start", filter.Start.Value);
                parameters.Add("Length", filter.Length.Value);
            }

            // SQL to get skins for all cars in the result set, ordered by Favorite DESC
            var skinsSql = @"
            SELECT s.* FROM Cars_Skins s
            WHERE s.CarId IN (" + filteredCarIdsSql + @")
            ORDER BY s.Favorite DESC";

            // SQL to get car types for all cars in the result set
            var typesSql = @"
            SELECT ct.*, t.* FROM Cars_Types ct
            INNER JOIN CarTypes t ON ct.TypeId = t.Id
            WHERE ct.CarId IN (" + filteredCarIdsSql + @")";

            // SQL to get car stylings for all cars in the result set
            var stylingsSql = @"
            SELECT cs.*, s.* FROM Cars_Styling cs
            INNER JOIN CarStyling s ON cs.StylingId = s.Id
            WHERE cs.CarId IN (" + filteredCarIdsSql + @")";

            // SQL to get car specializations for all cars in the result set
            var specsSql = @"
            SELECT cs.*, rs.* FROM Cars_Specializations cs
            INNER JOIN RacingSpecializations rs ON cs.SpecializationId = rs.Id
            WHERE cs.CarId IN (" + filteredCarIdsSql + @")";

            // SQL to get car makes and models for all cars in the result set
            var makeModelSql = @"
            SELECT c.Id AS CarId, m.*, mdl.* FROM Cars c
            LEFT JOIN CarMakes m ON c.MakeId = m.Id
            LEFT JOIN CarModels mdl ON c.ModelId = mdl.Id
            WHERE c.Id IN (" + filteredCarIdsSql + @")";

            // Combine all queries for QueryMultiple
            var combinedSql = completedCarsSql + ";" + skinsSql + ";" + typesSql + ";" + stylingsSql + ";" + specsSql + ";" + makeModelSql;

            using (var connection = Connection.GetConnection())
            {
                using (var multi = connection.QueryMultiple(combinedSql, parameters))
                {
                    // Get cars and related data from the result sets
                    var cars = multi.Read<Car>().ToList();
                    var skins = multi.Read<CarSkin>().ToList();
                    var typesData = multi.Read<dynamic>().ToList();
                    var stylingsData = multi.Read<dynamic>().ToList();
                    var specsData = multi.Read<dynamic>().ToList();
                    var makesModelsData = multi.Read<dynamic>().ToList();

                    // Group skins by car ID (already ordered by Favorite DESC in the SQL)
                    var skinsByCarId = skins.GroupBy(s => s.CarId)
                        .ToDictionary(g => g.Key, g => g.ToList());

                    // Group types by car ID
                    var typesByCarId = new Dictionary<int, List<CarType>>();
                    foreach (var item in typesData)
                    {
                        int carId = item.CarId;
                        var carType = new CarType
                        {
                            Id = item.Id,
                            Name = item.Name,
                            CarId = carId
                            // Add other type properties as needed
                        };

                        if (!typesByCarId.ContainsKey(carId))
                        {
                            typesByCarId[carId] = new List<CarType>();
                        }
                        typesByCarId[carId].Add(carType);
                    }

                    // Group stylings by car ID
                    var stylingsByCarId = new Dictionary<int, List<CarStyling>>();
                    foreach (var item in stylingsData)
                    {
                        int carId = item.CarId;
                        var styling = new CarStyling
                        {
                            Id = item.Id,
                            Name = item.Name,
                            CarId = carId
                            // Add other styling properties as needed
                        };

                        if (!stylingsByCarId.ContainsKey(carId))
                        {
                            stylingsByCarId[carId] = new List<CarStyling>();
                        }
                        stylingsByCarId[carId].Add(styling);
                    }

                    // Group specializations by car ID
                    var specsByCarId = new Dictionary<int, List<CarSpecialization>>();
                    foreach (var item in specsData)
                    {
                        int carId = item.CarId;
                        var spec = new CarSpecialization
                        {
                            SpecializationId = item.Id,
                            Name = item.Name,
                            CarId = carId
                            // Add other specialization properties as needed
                        };

                        if (!specsByCarId.ContainsKey(carId))
                        {
                            specsByCarId[carId] = new List<CarSpecialization>();
                        }
                        specsByCarId[carId].Add(spec);
                    }

                    // Create dictionary for make/model data
                    var makeModelByCarId = makesModelsData.ToDictionary(item => (int)item.CarId);

                    // Assign all related data to their respective cars
                    foreach (var car in cars)
                    {
                        // Assign skins
                        if (skinsByCarId.TryGetValue(car.Id, out var carSkins))
                        {
                            car.Skins = carSkins;
                        }
                        else
                        {
                            car.Skins = new List<CarSkin>();
                        }

                        // Assign types
                        if (typesByCarId.TryGetValue(car.Id, out var carTypes))
                        {
                            car.Types = carTypes;
                        }
                        else
                        {
                            car.Types = new List<CarType>();
                        }

                        // Assign stylings
                        if (stylingsByCarId.TryGetValue(car.Id, out var carStylings))
                        {
                            car.Stylings = carStylings;
                        }
                        else
                        {
                            car.Stylings = new List<CarStyling>();
                        }

                        // Assign specializations
                        if (specsByCarId.TryGetValue(car.Id, out var carSpecs))
                        {
                            car.Specializations = carSpecs;
                        }
                        else
                        {
                            car.Specializations = new List<CarSpecialization>();
                        }

                        // Assign make and model details if available
                        if (makeModelByCarId.TryGetValue(car.Id, out var makeModelData))
                        {
                            // These properties should already be set via the main car query,
                            // but we can enhance with additional make/model properties if needed
                            if (car.MakeId == 0 && makeModelData.Id != null)
                            {
                                car.MakeId = makeModelData.Id;
                            }
                        }
                    }

                    return cars;
                }
            }
        }
    }
}
