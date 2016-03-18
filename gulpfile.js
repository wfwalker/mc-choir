'use strict';

var gulp = require('gulp');
var oghliner = require('oghliner');
var eslint = require('gulp-eslint');
var path = require('path');
// var connect = require('gulp-connect');

gulp.task('default', ['build', 'offline']);

// The files comprised by the app.
var srcFiles = [
  '*.html',
  'audio/*.mp3',
  'img/*.png',
  'w3c-manifest.json',
  'css/*.css',
  'fonts/*.*',
  'js/*.js',
];

// The directory in which the app will be built, and from which it is offlined
// and deployed.  This is also the prefix that will be stripped from the front
// of paths cached by the offline worker, so it should include a trailing slash
// to ensure the leading slash of the path is stripped, i.e. to ensure
// dist/css/style.css becomes css/style.css, not /css/style.css.
var rootDir = 'dist/';

gulp.task('copy-js-libs', function() {
    return gulp.src([
          'node_modules/jquery/dist/jquery.min.js',
          'node_modules/fastclick/lib/fastclick.js',
          'node_modules/bootstrap/dist/js/bootstrap.min.js'
        ])
        .pipe(gulp.dest(function(file) {
            file.path = file.base + path.basename(file.path);
            return rootDir + 'js';
        }));
});

gulp.task('copy-css-libs', function() {
    return gulp.src([
          'node_modules/bootstrap/dist/css/bootstrap.css'
        ])
        .pipe(gulp.dest(function(file) {
            file.path = file.base + path.basename(file.path);
            return rootDir + 'css';
        }));
});

gulp.task('lint', function() {
  return gulp.src(['js/app.js']).pipe(eslint({
    'rules':{
        'quotes': [1, 'single'],
        'semi': [1, 'always'],
        'comma-dangle': [1, 'always-multiline'],
        'quote-props': [1, 'as-needed']
    }
  })).pipe(eslint.format());
});

gulp.task('build', function(callback) {
  return gulp.src(srcFiles, { base: '.' }).pipe(gulp.dest(rootDir));
});

gulp.task('offline', ['build', 'copy-js-libs', 'copy-css-libs'], function(callback) {
  oghliner.offline({
    rootDir: rootDir,
    fileGlobs: srcFiles,
  }, callback);
});

gulp.task('deploy', ['offline'], function(callback) {
  oghliner.deploy({
    rootDir: rootDir,
  }, callback);
});

// gulp.task('serve', ['deploy'], function () {
//   connect.server({
//     root: 'dist',
//   });
// });

