using Microsoft.AspNetCore.Mvc;
using RacerUI.Models;
using System.Diagnostics;

namespace RacerUI.Controllers
{
    public class DashboardController : BaseController
    {
        [Route("dashboard")]
        public IActionResult Index()
        {
            if (!CheckSecurity()) { return RedirectToAction("access-denied"); }

            return View(new DashboardViewModel() { 
                Config = App.Config 
            });
        }

        [Route("dashboard/error")]
        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        [Route("access-denied")]
        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult AccessDenied()
        {
            return View();
        }
    }
}