module.exports = function (grunt) {
    grunt.registerMultiTask('vite', 'Builds the web app with Vite', function () {
        const done = this.async();
        const { build } = require('vite');
        const viteConfig = require('../vite.config');

        build(viteConfig.config(this.options()))
            .then(() => {
                grunt.log.writeln('Vite build complete');
                done();
            })
            .catch((err) => {
                grunt.fail.warn(
                    'Vite returned an error: \n' + (err && err.stack ? err.stack : err)
                );
            });
    });
};
