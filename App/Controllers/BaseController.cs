using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;

namespace RacerUI.Controllers
{
    public class BaseController : Controller
    {
        public const string AuthCookieName = "RacerUI.Auth";
        private const string AuthPurpose = "RacerUI.Auth";

        // Payload is a hash of the configured admin credentials so that
        // changing them invalidates existing auth cookies
        public static string AuthPayload()
        {
            var creds = $"{App.Config.Admin.Username}:{App.Config.Admin.Pass}";
            return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(creds)));
        }

        private static IDataProtector Protector(IServiceProvider services) =>
            services.GetRequiredService<IDataProtectionProvider>().CreateProtector(AuthPurpose);

        // Issues the persistent signed+encrypted auth cookie (refresh token)
        public static void SetAuthCookie(HttpContext context)
        {
            var token = Protector(context.RequestServices).Protect(AuthPayload());
            context.Response.Cookies.Append(AuthCookieName, token, new CookieOptions
            {
                HttpOnly = true,
                IsEssential = true,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(30)
            });
        }

        public bool CheckSecurity()
        {
            if (HttpContext.Session.Keys.Contains("admin") && HttpContext.Session.GetString("admin") == "1")
            {
                return true;
            }

            // session lost (app restart or expiry) - try the auth cookie
            var token = Request.Cookies[AuthCookieName];
            if (!string.IsNullOrEmpty(token))
            {
                try
                {
                    if (Protector(HttpContext.RequestServices).Unprotect(token) == AuthPayload())
                    {
                        HttpContext.Session.SetString("admin", "1");
                        return true;
                    }
                }
                catch { /* invalid or tampered cookie */ }
            }
            return false;
        }
    }
}
