var svgstore = require('./index')
var gulp = require('gulp')
var cheerio = require('gulp-cheerio')
var inject = require('gulp-inject')
var replace = require('gulp-replace');


gulp.task('icons', function () {
  return gulp
    .src('./icons/*.svg')
    .pipe(cheerio({
      run: function ($) {
        $('[fill="none"]').removeAttr('fill')
      },
      parserOptions: { xmlMode: true }
    }))
    .pipe(svgstore())
    .pipe(replace('svg"><defs>', 'svg">\n\n\n' +
    '<style type="text/css">\n' +
    'use:not(.svg-nocolor){fill:currentColor}\n' +
    'use:not(.svg-nocolor):visited{color:currentColor}\n' +
    'use:not(.svg-nocolor):hover{color:currentColor}\n' +
    'use:not(.svg-nocolor):active{color:currentColor}\n' +
    '</style>\n\n\n' + 
    '<defs>'))
    .pipe(replace(' fill="#FFFFFF"', ''))
    .pipe(replace(' fill="#ffffff"', ''))
    .pipe(replace(' fill="#000000"', ''))
    .pipe(replace(' fill="#000"', ''))
	.pipe(gulp.dest('../../App/wwwroot/images'));
});

gulp.task('logo', function () {
  return gulp
    .src('./racerui-logo/*.svg')
    .pipe(svgstore())
	.pipe(gulp.dest('../../App/wwwroot/images'));
});