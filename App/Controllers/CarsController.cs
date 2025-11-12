using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using RacerUI.Entities;
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
        
        [HttpPost("filter")]
        public IActionResult Filter([FromBody] CarFilterModel filterModel)
        {
            // Create a new filter entity with default empty collections
            if (filterModel?.Countries.Count > 0 && filterModel?.Countries[0] == "all")
            {
                filterModel.Countries.Clear();
            }
            var filterEntity = new CarFilter
            {
                Countries = filterModel?.Countries ?? new List<string>(),
                Makes = filterModel?.Makes ?? new List<int>(),
                Models = filterModel?.Models ?? new List<int>(),
                Years = filterModel?.Years ?? new List<int>(),
                Types = filterModel?.Types ?? new List<int>(),
                Styles = filterModel?.Styles ?? new List<int>(),
                Specializations = filterModel?.Specializations ?? new List<int>(),
                Search = filterModel?.Search,
                Start = filterModel?.Start,
                Length = filterModel?.Length
            };
            
            var results = CarsRepository.AdvancedFilter(filterEntity);
            
            // Strip null and empty array properties from the response
            var options = new JsonSerializerOptions
            {
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            };
            
            // Manually clean up empty arrays in the results
            CleanupEmptyCollections(results);
            
            return new JsonResult(results, options);
        }
        
        private void CleanupEmptyCollections(CarResultsModel results)
        {
            if (results?.Cars != null)
            {
                foreach (var car in results.Cars)
                {
                    // Use reflection to find all List properties and set empty ones to null
                    var listProperties = car.GetType().GetProperties()
                        .Where(p => p.PropertyType.IsGenericType && 
                                    p.PropertyType.GetGenericTypeDefinition() == typeof(List<>) &&
                                    p.CanWrite);
                    
                    foreach (var prop in listProperties)
                    {
                        var value = prop.GetValue(car);
                        if (value != null)
                        {
                            var count = (int)value.GetType().GetProperty("Count").GetValue(value);
                            if (count == 0)
                            {
                                prop.SetValue(car, null);
                            }
                        }
                    }
                }
            }
            
            if (results?.Makes?.Count == 0) results.Makes = null;
            if (results?.Types?.Count == 0) results.Types = null;
            if (results?.Stylings?.Count == 0) results.Stylings = null;
            if (results?.Specializations?.Count == 0) results.Specializations = null;
        }
    }
}