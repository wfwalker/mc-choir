'use strict';

var gulp = require('gulp');
var oghliner = require('oghliner');

gulp.task('default', ['build', 'offline']);

// The files comprised by the app.
var srcFiles = [
  '*.html',
  '*.mp3',
  '*.png',
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

gulp.task('build', function(callback) {
  return gulp.src(srcFiles, { base: '.' }).pipe(gulp.dest(rootDir));
});

gulp.task('offline', ['build'], function(callback) {
  oghliner.offline({
    rootDir: rootDir,
    fileGlobs: srcFiles,
  }, callback);
});

gulp.task('deploy', function(callback) {
  oghliner.deploy({
    rootDir: rootDir,
  }, callback);
});
