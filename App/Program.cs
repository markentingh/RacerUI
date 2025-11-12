using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.StaticFiles;
using RacerUI.SQL;
using RacerUI;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        // Configure JSON serialization to be case-insensitive and ignore null values
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.WriteIndented = true;
    });
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromDays(10);
    options.Cookie.HttpOnly = true;
    options.Cookie.Name = ".RacerUI";
    options.Cookie.IsEssential = true;
});

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", builder =>
    {
        builder
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()
            .SetIsOriginAllowed(_ => true);
    });
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

//handle static files
var provider = new FileExtensionContentTypeProvider();

// Add static file mappings
provider.Mappings[".svg"] = "image/svg";
var options = new StaticFileOptions
{
    ContentTypeProvider = provider
};
app.UseStaticFiles(options);

app.UseRouting();
app.UseCors("CorsPolicy");
app.UseAuthorization();


//check if app is running in Docker Container
App.IsDocker = System.Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";

switch (app.Environment.EnvironmentName.ToLower())
{
    case "production":
        App.Environment = RacerUI.Environment.production;
        break;
    case "staging":
        App.Environment = RacerUI.Environment.staging;
        break;
    default:
        App.Environment = RacerUI.Environment.development;
        break;
}

//load application-wide config
App.ConfigFilename = "config" +
    (App.IsDocker ? ".docker" : "") +
    (App.Environment == RacerUI.Environment.production ? ".prod" : "") + ".json";

var builtConfig = new ConfigurationBuilder()
                .AddJsonFile(App.MapPath(App.ConfigFilename))
                .AddEnvironmentVariables().Build();
builtConfig.Bind(App.Config);

//get LLM private keys
LLMs.Available[LLMs.Models.Qwen].PrivateKey = App.Config.LLM.Qwen.PrivateKey;
LLMs.Available[LLMs.Models.ChatGPT].PrivateKey = App.Config.LLM.ChatGPT.PrivateKey;
LLMs.Available[LLMs.Models.Gemini].PrivateKey = App.Config.LLM.Gemini.PrivateKey;

//load game info from database
var games = GamesRepository.GetAll();
foreach (var game in games)
{
    var gameInfo = App.Game(game.Name);
    if(gameInfo != null)
    {
        gameInfo.GamePath = game.Path;
        gameInfo.GameId = game.Id;
    }
}

//load car info from database
App.CarTypes = CarTypesRepository.GetAll().ToList();
App.CarStylings = CarStylingRepository.GetAll().ToList();
App.CarSpecializations = CarSpecializationsRepository.GetAll().ToList();

//map controllers
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

//map SignalR hubs
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
        App.Addresses.Add(address);
    }
}

app.WaitForShutdown();