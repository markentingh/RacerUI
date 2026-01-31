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
                years: filterModel?.Years,
                classes: classes,
                typeIds: filterModel?.Types,
                styleIds: filterModel?.Styles,
                specializationIds: filterModel?.Specializations,
                searchText: filterModel?.Search,
                start: filterModel?.Start,
                length: filterModel?.Length
            );

            var carsList = cars.ToList();

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