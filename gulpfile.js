var gulp = require('gulp');

var plugins = {
    jade : require('gulp-jade'),
    rename : require('gulp-rename'),
    clean : require('gulp-clean'),
    i18n : require('i18next'),
    i18parser : require('i18next-parser')
};

var languages = ['dev', 'ru', 'en', 'ua'];
var namespaces = ['bmw', 'mersedes'];

var paths = {
    dist: './dist/',
    templates: './templates/*.jade',
    locales: 'locales'
};

var tasks_locals = [];
var nameSpacesIsLoaded = false;

languages.forEach(function(lng) {
    namespaces.forEach(function(nsps) {
        var task_name = 'i18n-' + lng + '-' + nsps;
        var task_name_parse = 'i18n-parse-' + lng + '-' + nsps;
        createTaskI18nParse(lng, nsps, task_name_parse);
        createTaskI18n(lng, nsps, task_name);
        tasks_locals.push(task_name);
    });
});

plugins.i18n.loadNamespaces(namespaces);

plugins.i18n.init({
    resGetPath: 'locales/__lng__/__ns__.json'
    , preload: languages
});

// TASKS

gulp.task('i18parser', function() {
    return gulp.src(paths.templates)
        .pipe(plugins.i18parser({
            locales: languages,
            namespace: 'mersedes'
        }))
        .pipe(paths.locales);
});

gulp.task('clear', function() {
    return gulp.src(paths.dist)
        .pipe(plugins.clean({force: true}));
});

gulp.task('loadNamespaces', function(callback) {
    plugins.i18n.loadNamespaces(namespaces, function() {
        nameSpacesIsLoaded = true;
        callback();
    });
});

gulp.task('default', tasks_locals.concat('clear'));

/**
 * Generate gulp tasks for create locales files
 * @param {string} lng language
 * @param {string} ns namespace
 * @param {string} task_name task name
 * @returns {string} task name
 */
function createTaskI18nParse(lng, ns, task_name) {
    gulp.task(task_name, ['loadNamespaces'], function () {
        return gulp.src(paths.templates)
            .pipe(plugins.i18parser({
                locales: lng,
                namespace: ns
            }))
            .pipe(paths.locales);

    });

    return task_name;
}

/**
 * Generate gulp tasks for generate html files from jade with locales
 * @param {string} lng language
 * @param {string} ns namespace
 * @param {string} task_name task name
 * @returns {string} task name
 */
function createTaskI18n(lng, ns, task_name) {

    gulp.task(task_name, ['loadNamespaces'], function (callback) {

        if (!nameSpacesIsLoaded) {
            callback();
            return;
        }

        return gulp.src('./*.jade')
            .pipe(plugins.jade({
                locals: {
                    t: function(key, options) {
                        options = options || {};
                        options.lng = lng;
                        options.ns = ns;
                        return plugins.i18n.t(key, options);
                    }
                }
            }))
            .pipe(plugins.rename({
                dirname: ns,
                suffix: '-' + lng
            }))
            .pipe(gulp.dest(paths.dist));

    });

    return task_name;
}