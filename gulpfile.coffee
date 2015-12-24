gulp = require 'gulp'
runSequence = require 'run-sequence'
coffee = require 'gulp-coffee'
watch = require 'gulp-watch'
plumber = require 'gulp-plumber'
compass = require 'gulp-compass'

assets_dest = 'app/vendor/'

# basic tasks
gulp.task 'js', ->
  gulp.src './src/coffee/*.coffee'
    .pipe plumber()
    .pipe coffee()
    .pipe gulp.dest('./app/js/')

gulp.task 'css', false, ->
  gulp
    .src './src/sass/*.scss'
    .pipe plumber()
    .pipe compass({'sass':'src/sass', 'css':'app/css', 'bundle_exec': true})
    .pipe gulp.dest('./app/css/')

# command tasks
gulp.task 'default', (callback) ->
  runSequence(
    ['js', 'css']
    callback
  )

gulp.task 'watch', ->
  watch(['./src/coffee/*.coffee', './src/sass/*.scss'], (event) ->
    gulp.start('default')
  )

