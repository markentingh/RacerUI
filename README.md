# RacerUI
#### A web-based user interface for managing your racing simulator game library
Import your racing simulator game libraries and customize your gaming experience using a single-page web UI built using HTML, CSS, & JavaScript

![Racer UI logo](https://raw.githubusercontent.com/markentingh/RacerUI/refs/heads/main/Images/Logo/RacerUI_Logo_Light_640x244.png)

### Installation
1. Build or publish the `App/RacerUI` application
2. Within PowerShell, run `.\RacerUI.exe` after navigating to the published folder to start the RacerUI web server.
3. Navigate to `http://localhost:6500` (the configured URL) to log into the dashboard
4. Add your game to the library to start scanning the file system for cars & tracks.

### Docker Setup
1. Build the Docker image using the provided Dockerfile

### Configuration
* Configuration found in `App/config.json`
    * `Admin` section contains admin username & password
* If you want to change the web server port, update `App/Properties/launchSettings.json` **RacerUI** profile

### Development
* Uses .NET console application to host a **MVC + Razor** web app in `App/Program.cs`
    * Models found in `App/Models`
    * Views (Razor) found in `App/Views`
    * Controllers found in `App/Controllers`
* Uses custom **JavaScript** framework found in `App/Scripts`
    * compile scripts using `gulp default`
    * while working on scripts, run `gulp watch` to watch for changes and compile on the fly
* Uses custom **CSS** UI framework found in `App/CSS`
    * compile CSS using `gulp less`
    * while working on css, run `gulp watch` to watch for changes and compile on the fly
* Uses **Sqlite** for free database storage in `App/SQL`
* Uses **SignalR** for real-time updates between web app & server in `App/SignalR`
* `App/wwwroot` folder contains the compiled files

### Icons
The SVG icons compiler can be found in `Images/SVG`. All SVG files located in `Images/SVG/icons` are compiled into `App/wwwroot/images/icons.svg`. Please follow the instructions below to compile icons

* run `gulp icons` to compile icons
* make sure no SVG elements contain `fill` attributes unless specified since we are going to use CSS colors to color the icons the same way we color text


    
