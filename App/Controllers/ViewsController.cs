using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace RacerUI.Controllers
{
    public class ViewsController : BaseController
    {
        private readonly IMemoryCache _memoryCache;
        
        public ViewsController(IMemoryCache memoryCache)
        {
            _memoryCache = memoryCache;
        }
        
        [Route("views/{*path}")]
        public IActionResult Index(string path)
        {
            // Only check cache if not in development mode
            if (RacerUI.App.Environment != RacerUI.Environment.development && 
                _memoryCache.TryGetValue($"view_{path}.html", out string cachedView))
            {
                return Content(cachedView, "text/html");
            }
            
            // Path to the component view file
            string viewPath = Path.Combine(Directory.GetCurrentDirectory(), "Views", "Components", $"{path}.html");
            
            // Check if file exists
            if (!System.IO.File.Exists(viewPath))
            {
                return NotFound($"View '{path}' not found");
            }
            
            // Read the HTML content
            string viewContent = System.IO.File.ReadAllText(viewPath);
            
            // Only cache the view if not in development mode
            if (RacerUI.App.Environment != RacerUI.Environment.development)
            {
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetSlidingExpiration(TimeSpan.FromMinutes(30));
                    
                _memoryCache.Set($"view_{path}", viewContent, cacheOptions);
            }
            
            return Content(viewContent, "text/html");
        }
    }
}