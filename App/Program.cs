using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Hosting.Server;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromDays(10);
    options.Cookie.HttpOnly = true;
    options.Cookie.Name = ".RacerUI";
    options.Cookie.IsEssential = true;
});
builder.Services.AddSignalR();
builder.Services.AddMvc().AddRazorRuntimeCompilation();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseSession();
//app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();


//check if app is running in Docker Container
RacerUI.App.IsDocker = System.Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";

switch (app.Environment.EnvironmentName.ToLower())
{
    case "production":
        RacerUI.App.Environment = RacerUI.Environment.production;
        break;
    case "staging":
        RacerUI.App.Environment = RacerUI.Environment.staging;
        break;
    default:
        RacerUI.App.Environment = RacerUI.Environment.development;
        break;
}

//load application-wide cache
RacerUI.App.ConfigFilename = "config" +
    (RacerUI.App.IsDocker ? ".docker" : "") +
    (RacerUI.App.Environment == RacerUI.Environment.production ? ".prod" : "") + ".json";

var builtConfig = new ConfigurationBuilder()
                .AddJsonFile(RacerUI.App.MapPath(RacerUI.App.ConfigFilename))
                .AddEnvironmentVariables().Build();
builtConfig.Bind(RacerUI.App.Config);

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");


app.MapHub<RacerUI.SignalR.DashboardHub>("/dashboardhub");

app.Start();

//get IP addresses for running application
var server = app.Services.GetRequiredService<IServer>();
var addressFeature = server.Features.Get<IServerAddressesFeature>();
if (addressFeature != null)
{
    foreach (var address in addressFeature.Addresses)
    {
        Console.WriteLine($"Listening to {address}");
        RacerUI.App.Addresses.Add(address);
    }
}

app.WaitForShutdown();