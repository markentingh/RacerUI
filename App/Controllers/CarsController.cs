using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using RacerUI.Entities;
using RacerUI.Models;
using RacerUI.SQL;
using System.Collections.Generic;
using System.Linq;

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
            
            var cars = CarsRepository.AdvancedFilter(filterEntity);
            
            return Ok(cars);
        }
    }
}