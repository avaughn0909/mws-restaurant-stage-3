'use strict';
// gulp plug-ins
const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const runSequence = require('run-sequence');
const responsiveGm = require('gulp-responsive-images');
const responsiveSharp = require('gulp-responsive');
const autoprefixer = require('gulp-autoprefixer');
const csso = require('gulp-csso');
const del = require('del');
const htmlmin = require('gulp-htmlmin');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify-es').default;
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const $ = gulpLoadPlugins();

gulp.task('browser-sync', () =>{
	browserSync.init({
		server: './dist'
	});
	browserSync.stream();

});

gulp.task('copy-index', () => {
	gulp.src('./app/index.html')
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-rest', () => {
	gulp.src('./app/restaurant.html')
		.pipe(gulp.dest('./dist'));
});



// use imagemin then move to folder images
gulp.task('imagesmin', () => {
	return gulp.src('./app/img/**/*/')
		.pipe(($.imagemin())
			.pipe(gulp.dest('./dist/img/')));
});

// copies any images in fixed to images folder
gulp.task('copy-fixed-images', () => {
	return gulp.src('./img/**/*/')
		.pipe(gulp.dest('./img/'));
});

gulp.task('copy-manifest', () => {
	return gulp.src('./app/manifest.json')
		.pipe(gulp.dest('./dist'));
});


gulp.task('styles', () => {
	return gulp.src('./app/css/**/*.css')
	// Auto-prefix css styles for cross browser compatibility
		.pipe(autoprefixer())
		.pipe(csso())
		.pipe(gulp.dest('./dist/css'))
		.pipe(browserSync.stream());
});


gulp.task('mainscripts', () => {
	return gulp.src('./app/js/main/*.js')
		.pipe(uglify())
	   .pipe(concat('index.js'))
		.pipe(gulp.dest('./dist/js'));
});

gulp.task('restscripts', () =>{
	return gulp.src('./app/js/rest/*.js')
		.pipe(uglify())
	   .pipe(concat('rest.js'))
		.pipe(gulp.dest('./dist/js'));
});

gulp.task('sw:dist', () => {
	const browse = browserify({
		debug: true
	});

	return browse
		.transform(babelify.configure({
			presets: ['@babel/preset-env']
		}))
		.transform(babelify)
		.require('./app/sw.js', { entry: true })
		.bundle()
		.pipe(source('sw.js'))
		.pipe(gulp.dest('./dist'));
});
// combo build task for responsive (gm) and min images
gulp.task('default', function(callback) {
	runSequence('browser-sync', 'sw:dist', 'copy-manifest', 'copy-index', 'copy-rest', 'imagesmin',  'styles', 'mainscripts',
		'restscripts', callback);
});
