using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using RacerUI.Entities;
using RacerUI.Helpers;
using RacerUI.Models;
using RacerUI.SQL;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace RacerUI.Controllers
{
    [Route("api/cars")]
    public class CarsController : BaseController
    {
        private readonly IMemoryCache _memoryCache;
        
        public CarsController(IMemoryCache memoryCache)
        {
            _memoryCache = memoryCache;
        }
        
        [HttpPost("classes")]
        public IActionResult GetClasses([FromBody] CarFilterModel filterModel)
        {
            // Force country codes to uppercase
            var countries = filterModel?.Countries;
            if (countries != null && countries.Count > 0)
            {
                countries = countries.Select(c => c.ToUpper()).ToList();
            }

            // Get available classes based on current filters
            var availableClasses = CarsRepositoryFilterHelpers.GetAvailableClasses(
                countryCodes: countries,
                makeIds: filterModel?.Makes,
                modelIds: filterModel?.Models,
                years: filterModel?.Years,
                typeIds: filterModel?.Types,
                styleIds: filterModel?.Styles,
                specializationIds: filterModel?.Specializations,
                searchText: filterModel?.Search
            ).ToHashSet();

            // Filter the classes by category to only include available ones
            var classesByCategory = CarsHelper.AllClassesByCategory
                .Select(kvp => new
                {
                    Category = kvp.Key,
                    Classes = kvp.Value
                        .Where(c => availableClasses.Contains(c.Name))
                        .Select(c => new
                        {
                            Name = c.Name,
                            MinYear = c.MinYear,
                            MaxYear = c.MaxYear
                        }).ToList()
                })
                .Where(cat => cat.Classes.Any())
                .ToList();

            return Ok(classesByCategory);
        }

        [HttpPost("countries")]
        public IActionResult GetCountries([FromBody] CarFilterModel filterModel)
        {
            // Get available countries based on current filters (excluding country filter itself)
            var distinctCountryCodes = CarsRepositoryFilterHelpers.GetAvailableCountries(
                makeIds: filterModel?.Makes,
                modelIds: filterModel?.Models,
                years: filterModel?.Years,
                classes: filterModel?.Classes,
                typeIds: filterModel?.Types,
                styleIds: filterModel?.Styles,
                specializationIds: filterModel?.Specializations,
                searchText: filterModel?.Search
            );

            var countries = distinctCountryCodes
                .Select(code => new
                {
                    Code = code.ToLower(),
                    Name = CountriesHelper.GetName(code)
                })
                .Where(c => !string.IsNullOrEmpty(c.Name))
                .OrderBy(c => c.Name)
                .ToList();

            return Ok(countries);
        }

        [HttpPost("manufacturers")]
        public IActionResult GetManufacturers([FromBody] CarFilterModel filterModel)
        {
            // Force country codes to uppercase
            var countries = filterModel?.Countries;
            if (countries != null && countries.Count > 0)
            {
                countries = countries.Select(c => c.ToUpper()).ToList();
            }

            var makes = CarsRepositoryFilterHelpers.GetAvailableMakes(
                countryCodes: countries,
                modelIds: filterModel?.Models,
                years: filterModel?.Years,
                classes: filterModel?.Classes,
                typeIds: filterModel?.Types,
                styleIds: filterModel?.Styles,
                specializationIds: filterModel?.Specializations,
                searchText: filterModel?.Search
            )
                .Select(m => new
                {
                    Id = (int)m.Id,
                    Name = (string)m.Name
                })
                .ToList();

            return Ok(makes);
        }

        [HttpPost("models")]
        public IActionResult GetModels([FromBody] CarFilterModel filterModel)
        {
            // Force country codes to uppercase
            var countries = filterModel?.Countries;
            if (countries != null && countries.Count > 0)
            {
                countries = countries.Select(c => c.ToUpper()).ToList();
            }

            // Models are listed only as a narrowing filter - they are always
            // scoped to the other active filters, never fetched unfiltered
            var models = CarsRepositoryFilterHelpers.GetAvailableModels(
                countryCodes: countries,
                makeIds: filterModel?.Makes,
                years: filterModel?.Years,
                classes: filterModel?.Classes,
                typeIds: filterModel?.Types,
                styleIds: filterModel?.Styles,
                specializationIds: filterModel?.Specializations,
                searchText: filterModel?.Search
            )
                .Select(m => new
                {
                    Id = (int)m.Id,
                    Name = (string)m.Name
                })
                .ToList();

            return Ok(models);
        }

        [HttpPost("years")]
        public IActionResult GetYears([FromBody] CarFilterModel filterModel)
        {
            // Force country codes to uppercase
            var countries = filterModel?.Countries;
            if (countries != null && countries.Count > 0)
            {
                countries = countries.Select(c => c.ToUpper()).ToList();
            }

            var years = CarsRepositoryFilterHelpers.GetAvailableYears(
                countryCodes: countries,
                makeIds: filterModel?.Makes,
                modelIds: filterModel?.Models,
                classes: filterModel?.Classes,
                typeIds: filterModel?.Types,
                styleIds: filterModel?.Styles,
                specializationIds: filterModel?.Specializations,
                searchText: filterModel?.Search
            ).ToList();

            return Ok(years);
        }

        [HttpPost("types")]
        public IActionResult GetTypes([FromBody] CarFilterModel filterModel)
        {
            // Force country codes to uppercase
            var countries = filterModel?.Countries;
            if (countries != null && countries.Count > 0)
            {
                countries = countries.Select(c => c.ToUpper()).ToList();
            }

            var types = CarsRepositoryFilterHelpers.GetAvailableTypes(
                countryCodes: countries,
                makeIds: filterModel?.Makes,
                modelIds: filterModel?.Models,
                years: filterModel?.Years,
                classes: filterModel?.Classes,
                styleIds: filterModel?.Styles,
                specializationIds: filterModel?.Specializations,
                searchText: filterModel?.Search
            )
                .Select(t => new
                {
                    Id = (int)t.Id,
                    Name = (string)t.Name
                })
                .ToList();

            return Ok(types);
        }

        [HttpPost("styles")]
        public IActionResult GetStyles([FromBody] CarFilterModel filterModel)
        {
            // Force country codes to uppercase
            var countries = filterModel?.Countries;
            if (countries != null && countries.Count > 0)
            {
                countries = countries.Select(c => c.ToUpper()).ToList();
            }

            var styles = CarsRepositoryFilterHelpers.GetAvailableStyles(
                countryCodes: countries,
                makeIds: filterModel?.Makes,
                modelIds: filterModel?.Models,
                years: filterModel?.Years,
                classes: filterModel?.Classes,
                typeIds: filterModel?.Types,
                specializationIds: filterModel?.Specializations,
                searchText: filterModel?.Search
            )
                .Select(s => new
                {
                    Id = (int)s.Id,
                    Name = (string)s.Name
                })
                .ToList();

            return Ok(styles);
        }

        [HttpPost("specializations")]
        public IActionResult GetSpecializations([FromBody] CarFilterModel filterModel)
        {
            // Force country codes to uppercase
            var countries = filterModel?.Countries;
            if (countries != null && countries.Count > 0)
            {
                countries = countries.Select(c => c.ToUpper()).ToList();
            }

            var specializations = CarsRepositoryFilterHelpers.GetAvailableSpecializations(
                countryCodes: countries,
                makeIds: filterModel?.Makes,
                modelIds: filterModel?.Models,
                years: filterModel?.Years,
                classes: filterModel?.Classes,
                typeIds: filterModel?.Types,
                styleIds: filterModel?.Styles,
                searchText: filterModel?.Search
            )
                .Select(s => new
                {
                    Id = (int)s.Id,
                    Name = (string)s.Name
                })
                .ToList();

            return Ok(specializations);
        }

        /// <summary>
        /// Returns the torque (Nm) and power (bhp) curves for a car, read live
        /// from the car's data.acd / extracted data folder (power.lut).
        /// </summary>
        [HttpGet("{id}/powercurve")]
        public IActionResult GetPowerCurve(int id)
        {
            var car = CarsRepository.GetById(id);
            if (car == null)
            {
                return NotFound();
            }

            var points = new List<(double rpm, double nm)>();
            var game = GamesRepository.GetById(car.GameId);
            if (game != null && !string.IsNullOrEmpty(game.Path))
            {
                var carFolderPath = Path.Combine(game.Path, "content", "cars", car.Path);
                points = AssettoCorsaHelper.GetPowerCurve(carFolderPath);
            }

            // bhp = Nm * rpm / 7023.55 (metric hp - matches AC spec sheet numbers)
            var result = new
            {
                Rpm = points.Select(p => p.rpm).ToList(),
                Torque = points.Select(p => p.nm).ToList(),
                Power = points.Select(p => Math.Round(p.nm * p.rpm / 7023.55, 1)).ToList()
            };

            return Ok(result);
        }

        public class UpdateRatingRequest
        {
            public int? Rating { get; set; }
        }

        /// <summary>
        /// Saves a 0-5 rating for a car
        /// </summary>
        [HttpPost("{id}/rating")]
        public IActionResult UpdateRating(int id, [FromBody] UpdateRatingRequest request)
        {
            if (request == null || !request.Rating.HasValue)
            {
                return BadRequest(new { error = "A rating value is required." });
            }
            if (request.Rating.Value < 0 || request.Rating.Value > 5)
            {
                return BadRequest(new { error = "Rating must be between 0 and 5." });
            }

            return CarsRepository.UpdateRating(id, request.Rating.Value)
                ? Ok(new { id, rating = request.Rating.Value })
                : NotFound();
        }

        [HttpPost("filter")]
        public IActionResult Filter([FromBody] CarFilterModel filterModel)
        {
            // Validate required pagination parameters
            if (!filterModel.Start.HasValue || !filterModel.Length.HasValue)
            {
                return BadRequest(new { error = "Start and Length parameters are required for pagination." });
            }
            if (filterModel.Length.Value > 100)
            {
                return BadRequest(new { error = "Length parameter cannot be greater than 100." });
            }

            // Handle "all" selections by clearing the filter
            var countries = filterModel?.Countries;
            if (countries?.Count > 0 && countries[0] == "all")
            {
                countries = null;
            }
            
            // Force all country codes to uppercase
            if (countries != null && countries.Count > 0)
            {
                countries = countries.Select(c => c.ToUpper()).ToList();
            }

            var classes = filterModel?.Classes;
            if (classes?.Count > 0 && classes[0] == "all")
            {
                classes = null;
            }

            // Get total count without pagination first
            var totalCount = CarsRepository.FilterCount(
                countryCodes: countries,
                makeIds: filterModel?.Makes,
                modelIds: filterModel?.Models,
                years: filterModel?.Years,
                classes: classes,
                typeIds: filterModel?.Types,
                styleIds: filterModel?.Styles,
                specializationIds: filterModel?.Specializations,
                searchText: filterModel?.Search
            );

            // Call the repository Filter method with all parameters including pagination
            var cars = CarsRepository.Filter(
                countryCodes: countries,
                makeIds: filterModel?.Makes,
                modelIds: filterModel?.Models,
                years: filterModel?.Years,
                classes: classes,
                typeIds: filterModel?.Types,
                styleIds: filterModel?.Styles,
                specializationIds: filterModel?.Specializations,
                searchText: filterModel?.Search,
                start: filterModel?.Start,
                length: filterModel?.Length,
                sort: filterModel?.Sort
            );

            var carsList = cars.ToList();

            //add country name to each car
            foreach (var car in carsList)
            {
                car.CountryName = CountriesHelper.GetName(car.Country);
            }

            var results = new
            {
                Cars = carsList,
                TotalCount = totalCount,
                FilteredCount = carsList.Count
            };

            // Strip null and empty array properties from the response
            var options = new JsonSerializerOptions
            {
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            };

            return new JsonResult(results, options);
        }
    }
}