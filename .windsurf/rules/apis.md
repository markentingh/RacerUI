---
trigger: always_on
---

# SQLite + Dapper Data Access Layer

* repositories belong in App/SQL
* entities belong in App/Entities
* repositories must use entities for user input and/or method return objects

# Databae structure
* located in /App/SQL/db.sql

# SignalR Hubs
* located in /App/SignalR folder, DashboardHub.cs is used for analyzing new cars from the user's game content folder (for Assetto Corsa) and saving them to the database with AI generated meta data

# Client-side Javascript Framework
* located in App/Scripts, these js files make up the uncompiled client-side javascript for the dashboard & login pages.  the files are compiled using /App/gulpfile.js by executing command `gu;p default` or `gulp js` or `gulp js:app` or 'gulp js:login`. Once logged in, the user navigates to /dashboard route using App/Scripts/routing/routing.js system, which loads a view from /App/Views folder. Each view will have a {name}.html, {name}.js, and {name}.less file that is downloaded and used to render the single-page app in the users web browser.

Make sure thaat if you edit any of the files in App/Scripts to execute the relevant gulp command afterward.

# Cars page
* displays a list of cars by rendering a selected view from /App/Views/Cars/cars.js

#Tracks page
* displays a list of tracks by rendering selected view from /App/Views/Tracks/tracks.js