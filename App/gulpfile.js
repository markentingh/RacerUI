'use strict';

//includes
var gulp = require('gulp'),
    less = require('gulp-less'),
    replace = require('gulp-replace'),
    concat = require('gulp-concat'),
    fs = require('fs'),
    headerfooter = require('gulp-headerfooter'),
    glob = require('glob'),
    order = require('gulp-order');

//paths
var paths = {
    css: 'CSS/',
    scripts: 'Scripts/',
    webroot: 'wwwroot/',
};

//working paths
paths.working = {
    js: {
        app: paths.scripts + 'app.js',
        app_files: [
            paths.scripts + 'app/*.js',
            paths.scripts + 'signalr/*.js',
            paths.scripts + 'components/**/*.js',
            'Views/**/*.js',
            paths.scripts + 'routing/route*.js',
            paths.scripts + 'routing/routing.js',
            paths.scripts + 'utils/*.js',
            paths.scripts + 'init.js',
            paths.scripts + 'dashboard.js',
        ],
        login_files: [
            paths.scripts + 'app/ajax.js',
            paths.scripts + 'app/toggle.js',
            paths.scripts + 'app/dark-mode.js',
            paths.scripts + 'components/ui/darkmode-toggle.js',
            paths.scripts + 'init.js',
            paths.scripts + 'login.js',
        ]
    },
    less: {
        app: paths.css + 'app.less',
        app_files: [
            paths.css + 'app/*.less',
            paths.css + 'app/**/*.less',
            'Views/**/*.less',
            paths.css + 'colors/*.less',
        ],
        login: paths.css + 'login.less',
        login_files: [
            paths.css + 'app/core.less',
            paths.css + 'app/toggle.less',
        ],
        colors: paths.css + 'colors/*.less'
    }
};

//compiled paths
paths.compiled = {
    css: paths.webroot + 'css/',
    js: {
        app: paths.webroot + 'js/app.js',
        login: paths.webroot + 'js/login.js',
    }
};

//tasks for compiling LESS & CSS /////////////////////////////////////////////////////////////////////
gulp.task('less:app', function () {
    // Find all LESS files in App/Pages/**
    var pagesLessFiles = glob.sync('Views/**/*.less');
    //console.log(pagesLessFiles);
    // Generate import statements for each LESS file
    var imports = pagesLessFiles.map(function(file) {
        // Convert Windows path to proper import path with forward slashes
        var importPath = file.replace(/\\/g, '/');
        return '@import "../' + importPath + '";';
    }).join('\n');
    
    // Replace placeholder in app.less with the generated imports
    var p = gulp.src(paths.working.less.app)
        .pipe(replace('/* views are added via gulp */', imports))
        .pipe(less());
    
    return p.pipe(gulp.dest(paths.compiled.css, { overwrite: true }));
});

gulp.task('less:colors', function () {
    var p = gulp.src(paths.working.less.colors)
        .pipe(less());
    return p.pipe(gulp.dest(paths.compiled.css, { overwrite: true }));
});

gulp.task('less:login', function () {
    var p = gulp.src(paths.working.less.login)
        .pipe(less());
    return p.pipe(gulp.dest(paths.compiled.css, { overwrite: true }));
});

gulp.task('less', gulp.series(['less:app', 'less:colors', 'less:login']));

//tasks for compiling javascript //////////////////////////////////////////////////////////////
const makeAppJs = (files, output) => {
    var app = fs.readFileSync(paths.working.js.app, 'utf8');
    var appParts = app.split('/*[js libraries goes here]*/');
    var p = gulp.src(files, { base: '.' })
        .pipe(order(files))
        .pipe(concat(output))
        .pipe(headerfooter(appParts[0], appParts[1]));
    return p.pipe(gulp.dest('.', { overwrite: true }));
};

gulp.task('js:app', function () {
    return makeAppJs(paths.working.js.app_files, paths.compiled.js.app);
});

gulp.task('js:login', function () {
    return makeAppJs(paths.working.js.login_files, paths.compiled.js.login);
});

gulp.task('js', gulp.series(['js:app', 'js:login']));

//watch task /////////////////////////////////////////////////////////////////////
gulp.task('watch', function () {
    //watch all specified files for changes
    gulp.watch([paths.working.less.app, paths.working.less.app_files, 'App/Pages/**/*.less'], gulp.series('less:app'));
    gulp.watch([paths.working.less.colors], gulp.series('less:colors'));
    gulp.watch([paths.working.less.login, paths.working.less.login_files], gulp.series('less:login'));
    gulp.watch([paths.working.js.app, paths.working.js.app_files], gulp.series('js:app'));
    gulp.watch([paths.working.js.login_files], gulp.series('js:login'));
});

//default task ////////////////////////////////////////////////////////////////////////////
gulp.task('default', gulp.series(['less', 'js', 'watch']));