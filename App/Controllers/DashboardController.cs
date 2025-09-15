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
            if (!CheckSecurity()) { return RedirectToAction("access-denied"); }

            if (path == "error")
            {
                return View("Error", new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
            }

            return View(new DashboardViewModel() { 
                Config = App.Config 
            });
        }

        [Route("access-denied")]
        public IActionResult AccessDenied()
        {
            return View();
        }
    }
}