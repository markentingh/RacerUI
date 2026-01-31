using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using RacerUI.Entities;
using RacerUI.Helpers;
using RacerUI.Models;
using RacerUI.SQL;
using System.Linq;

namespace RacerUI.Controllers
{
    [Route("api/tracks")]
    public class TracksController : BaseController
    {
        private readonly IMemoryCache _memoryCache;
        
        public TracksController(IMemoryCache memoryCache)
        {
            _memoryCache = memoryCache;
        }

        [HttpPost("countries")]
        public IActionResult GetCountries([FromBody] TrackFilterModel filterModel)
        {
            // Get available countries based on current filters (excluding country filter itself)
            var distinctCountryCodes = TracksRepository.GetDistinctCountries();

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

        [HttpPost("types")]
        public IActionResult GetTypes([FromBody] TrackFilterModel filterModel)
        {
            var types = TracksRepository.GetAllTypes()
                .Select(t => new
                {
                    Id = (int)t.Id,
                    Name = (string)t.Name
                })
                .ToList();

            return Ok(types);
        }

        [HttpPost("filter")]
        public IActionResult Filter([FromBody] TrackFilterModel filterModel)
        {
            // Validate pagination parameters
            if (!filterModel.Start.HasValue) filterModel.Start = 0;
            if (!filterModel.Length.HasValue) filterModel.Length = 100;

            // Force country codes to uppercase
            if (filterModel.Countries != null && filterModel.Countries.Count > 0)
            {
                filterModel.Countries = filterModel.Countries.Select(c => c.ToUpper()).ToList();
            }

            // Get total count
            var totalCount = TracksRepository.FilterCount(filterModel);

            // Get filtered tracks
            var tracks = TracksRepository.Filter(filterModel).ToList();

            // Map country codes to names
            foreach (var track in tracks)
            {
                if (!string.IsNullOrEmpty(track.Country))
                {
                    track.CountryName = CountriesHelper.GetName(track.Country);
                }
            }

            var result = new
            {
                Total = totalCount,
                Tracks = tracks
            };

            return Ok(result);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var track = TracksRepository.GetById(id);
            
            if (track == null)
            {
                return NotFound();
            }

            // Map country code to name
            if (!string.IsNullOrEmpty(track.Country))
            {
                track.CountryName = CountriesHelper.GetName(track.Country);
            }

            return Ok(track);
        }
    }
}
