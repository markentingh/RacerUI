using Microsoft.AspNetCore.Mvc;
using RacerUI.Models;
using System.Diagnostics;

namespace RacerUI.Controllers
{
    public class DashboardController : BaseController
    {
        [Route("dashboard/{*path}")]
        public IActionResult Index(string path)
        {
            if (!CheckSecurity()) { return RedirectToAction("AccessDenied", "Dashboard"); }

            if (path == "error")
            {
                return View("Error", new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
            }
            else if (path == "access-denied")
            {
                return View("AccessDenied");
            }

            return View(new DashboardViewModel() { 
                Config = App.Config 
            });
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult AccessDenied()
        {
            return View();
        }
    }
}