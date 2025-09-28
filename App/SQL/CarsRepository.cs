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
        public static CarResultsModel AdvancedFilter(CarFilter filter)
        {
            var conditions = new List<string>();
            var parameters = new DynamicParameters();

            var sql = @"
                CREATE TEMP TABLE CarsFilter
                (Id INTEGER PRIMARY KEY);
            
                INSERT INTO CarsFilter (Id)
                SELECT DISTINCT c.Id FROM Cars c
                LEFT JOIN CarMakes cmk ON cmk.Id = c.MakeId
                LEFT JOIN CarModels cmdl ON cmdl.Id = c.ModelId";

            //determine which joins to include based on filter
            if (filter.Types != null && filter.Types.Count > 0)
            {
                sql += @"
                JOIN Cars_Types ct ON c.Id = ct.CarId";
            }
            if (filter.Styles != null && filter.Styles.Count > 0)
            {
                sql += @"
                JOIN Cars_Styling cs ON c.Id = cs.CarId";
            }
            if (filter.Specializations != null && filter.Specializations.Count > 0)
            {
                sql += @"
                JOIN Cars_Specializations csp ON c.Id = csp.CarId";
            }
            if(filter.HasSkins == true)
            {
                sql += @"
                JOIN Cars_Skins cs ON c.Id = cs.CarId";
            }


            //determine which where clauses to include based on filter
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
            if (!string.IsNullOrEmpty(filter.Search))
            {
                conditions.Add(@"(
                c.Name LIKE @SearchTerm OR 
                c.ShortDescription LIKE @SearchTerm OR 
                c.Author LIKE @SearchTerm OR 
                cm.Name LIKE @SearchTerm OR 
                cm.Name LIKE @SearchTerm
            )");
                parameters.Add("SearchTerm", $"%{filter.Search}%");
            }

            //join all conditions
            if (conditions.Count > 0)
            {
                sql += @"
                WHERE " + string.Join(" AND ", conditions);
            }

            //add sorting & pagination
            sql += @"
                ORDER BY cmk.Name, cmdl.Name, c.Year
                LIMIT @Length OFFSET @Start;";
            parameters.Add("Start", filter.Start.HasValue ? filter.Start.Value : 0);
            parameters.Add("Length", filter.Length.HasValue ? filter.Length.Value : 20);

            // get all filtered cars with their related data
            var carsSql = @"
                SELECT c.* FROM Cars c WHERE c.Id IN (SELECT Id FROM CarsFilter);";

            // get skins for all cars in the result set, ordered by Favorite DESC
            var skinsSql = @"
                SELECT s.* FROM Cars_Skins s
                WHERE s.CarId IN (SELECT Id FROM CarsFilter)
                ORDER BY s.Favorite DESC;";

            // get car types for all cars in the result set - relationships and details
            var typesSql = @"
                SELECT ct.CarId, ct.TypeId FROM Cars_Types ct
                WHERE ct.CarId IN (SELECT Id FROM CarsFilter);
                
                SELECT DISTINCT t.* FROM CarTypes t
                INNER JOIN Cars_Types ct ON ct.TypeId = t.Id
                WHERE ct.CarId IN (SELECT Id FROM CarsFilter);";                

            // get car stylings for all cars in the result set - relationships and details
            var stylingsSql = @"
                SELECT cs.CarId, cs.StylingId FROM Cars_Styling cs
                WHERE cs.CarId IN (SELECT Id FROM CarsFilter);
                
                SELECT DISTINCT s.* FROM CarStyling s
                INNER JOIN Cars_Styling cs ON cs.StylingId = s.Id
                WHERE cs.CarId IN (SELECT Id FROM CarsFilter);";                

            // get car specializations for all cars in the result set - relationships and details
            var specsSql = @"
                SELECT cs.CarId, cs.SpecializationId FROM Cars_Specializations cs
                WHERE cs.CarId IN (SELECT Id FROM CarsFilter);
                
                SELECT DISTINCT rs.* FROM RacingSpecializations rs
                INNER JOIN Cars_Specializations cs ON cs.SpecializationId = rs.Id
                WHERE cs.CarId IN (SELECT Id FROM CarsFilter);";                

            // get car makes for all cars in the result set
            var makeSql = @"
                SELECT DISTINCT m.* FROM Cars c
                LEFT JOIN CarMakes m ON c.MakeId = m.Id
                WHERE c.Id IN (SELECT Id FROM CarsFilter);";

            // get car models for all cars in the result set
            var modelSql = @"
                SELECT DISTINCT m.* FROM Cars c
                LEFT JOIN CarModels m ON c.ModelId = m.Id
                WHERE c.Id IN (SELECT Id FROM CarsFilter);";

            // Combine all queries for QueryMultiple
            var combinedSql = sql + carsSql + skinsSql + typesSql + stylingsSql + specsSql + makeSql + modelSql + @"
                DROP TABLE CarsFilter";

            using (var connection = Connection.GetConnection())
            {
                using (var multi = connection.QueryMultiple(combinedSql, parameters))
                {
                    // Get cars and related data from the result sets
                    var cars = multi.Read<Car>().ToList();
                    var skins = multi.Read<CarSkin>().ToList();
                    
                    // Read types data (relationships and details)
                    var typesRelationships = multi.Read<dynamic>().ToList();
                    var typesDetails = multi.Read<CarType>().ToList();
                    
                    // Read stylings data (relationships and details)
                    var stylingsRelationships = multi.Read<dynamic>().ToList();
                    var stylingsDetails = multi.Read<CarStyling>().ToList();
                    
                    // Read specializations data (relationships and details)
                    var specsRelationships = multi.Read<dynamic>().ToList();
                    var specsDetails = multi.Read<RacingSpecialization>().ToList();
                    
                    // Read makes and models data
                    var makesData = multi.Read<CarMake>().ToList();
                    var modelsData = multi.Read<CarModel>().ToList();

                    // Group skins by car ID (already ordered by Favorite DESC in the SQL)
                    var skinsByCarId = skins.GroupBy(s => s.CarId)
                        .ToDictionary(g => g.Key, g => g.ToList());

                    // Create a dictionary of types by ID for quick lookup
                    var typesById = typesDetails.ToDictionary(t => t.Id);
                    
                    // Group types by car ID using the relationships
                    var typesByCarId = new Dictionary<int, List<CarType>>();
                    foreach (var rel in typesRelationships)
                    {
                        int carId = (int)rel.CarId;
                        int typeId = (int)rel.TypeId;
                        
                        // Look up the type details
                        if (typesById.TryGetValue(typeId, out var carType))
                        {
                            // Create a new instance with the car ID set
                            var typeWithCarId = new CarType
                            {
                                Id = carType.Id,
                                Name = carType.Name,
                                CarId = carId
                                // Copy any other properties from carType as needed
                            };
                            
                            if (!typesByCarId.ContainsKey(carId))
                            {
                                typesByCarId[carId] = new List<CarType>();
                            }
                            typesByCarId[carId].Add(typeWithCarId);
                        }
                    }

                    // Create a dictionary of stylings by ID for quick lookup
                    var stylingsById = stylingsDetails.ToDictionary(s => s.Id);
                    
                    // Group stylings by car ID using the relationships
                    var stylingsByCarId = new Dictionary<int, List<CarStyling>>();
                    foreach (var rel in stylingsRelationships)
                    {
                        int carId = (int)rel.CarId;
                        int stylingId = (int)rel.StylingId;
                        
                        // Look up the styling details
                        if (stylingsById.TryGetValue(stylingId, out var styling))
                        {
                            stylingsByCarId[carId].Add(styling);
                        }
                    }

                    // Create a dictionary of specializations by ID for quick lookup
                    var specsById = specsDetails.ToDictionary(s => s.Id);
                    
                    // Group specializations by car ID using the relationships
                    var specsByCarId = new Dictionary<int, List<RacingSpecialization>>();
                    foreach (var rel in specsRelationships)
                    {
                        int carId = (int)rel.CarId;
                        int specId = (int)rel.SpecializationId;
                        
                        // Look up the specialization details
                        if (specsById.TryGetValue(specId, out var spec))
                        {
                            specsByCarId[carId].Add(spec);
                        }
                    }

                    // Create dictionaries for makes and models by ID for quick lookup
                    var makesById = makesData.ToDictionary(m => m.Id);
                    var modelsById = modelsData.ToDictionary(m => m.Id);

                    // Create the result model
                    var result = new CarResultsModel
                    {
                        Cars = cars,
                        Makes = makesData.Count > 0 && makesData[0].Id > 0 ? makesData : new List<CarMake>(),
                        Types = typesDetails.ToList(),
                        Stylings = stylingsDetails.ToList(),
                        Specializations = specsDetails.ToList()
                    };

                    // Assign only model and skins to each car (these are unique to each car)
                    foreach (var car in result.Cars)
                    {
                        // Assign skins
                        if (skinsByCarId.TryGetValue(car.Id, out var carSkins))
                        {
                            car.Skins = carSkins;
                        }
                        
                        // Assign model details if available
                        if (car.ModelId.HasValue && car.ModelId > 0 && modelsById.TryGetValue(car.ModelId.Value, out var model))
                        {
                            car.Model = modelsById[car.ModelId.Value];
                        }

                        // Clear Make reference since it's in the shared collection
                        car.Make = null;
                        
                        // Keep only the IDs in the Types list
                        if (typesByCarId.TryGetValue(car.Id, out var carTypes))
                        {
                            car.Types = carTypes.Select(t => new CarType { Id = t.Id }).ToList();
                        }
                        
                        // Keep only the IDs in the Stylings list
                        if (stylingsByCarId.TryGetValue(car.Id, out var carStylings))
                        {
                            car.Stylings = carStylings.Select(s => new CarStyling { Id = s.Id }).ToList();
                        }
                        
                        // Keep only the IDs in the Specializations list
                        if (specsByCarId.TryGetValue(car.Id, out var carSpecs))
                        {
                            car.Specializations = carSpecs.Select(s => new CarSpecialization { Id = s.Id }).ToList();
                        }
                    }

                    return result;
                }
            }
        }
    }
}
