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
            if(car.Skins != null && car.Skins.Count > 0){
                foreach(var skin in car.Skins){
                    skin.CarId = carId;
                    var skinId = CarSkinsRepository.Add(skin);
                    if(skin.Drivers != null && skin.Drivers.Count > 0){
                        CarDriversRepository.DeleteBySkinId(skinId); //reset list of drivers for skin
                        foreach(var driver in skin.Drivers){
                            CarDriversRepository.Add(new CarDriver(){
                                CarId = carId,
                                DriverId = driver.Id,
                                SkinId = skinId
                            });
                        }
                    }
                }
            }

            // Add stylings if they exist
            if(car.Stylings != null && car.Stylings.Count > 0){
                foreach(var styling in car.Stylings)
                {
                    styling.CarId = carId;
                    CarStylingRepository.Add(styling);
                }
            }

            // Add tags if they exist
            if(car.Tags != null && car.Tags.Count > 0){
                foreach(var tag in car.Tags)
                {
                    tag.CarId = carId;
                    CarTagsRepository.Add(tag);
                }
            }

            // Add types if they exist
            if(car.Types != null && car.Types.Count > 0){
                foreach(var type in car.Types)
                {
                    type.CarId = carId;
                    CarTypesRepository.Add(type);
                }
            }

            // Add specializations if they exist
            if(car.Specializations != null && car.Specializations.Count > 0){
                foreach(var specialization in car.Specializations){
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
    }
}
