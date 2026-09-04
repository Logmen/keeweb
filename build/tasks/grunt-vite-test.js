module.exports = function (grunt) {
    grunt.registerMultiTask('vite-test', 'Builds the test bundle with Vite', function () {
        const done = this.async();
        const { build } = require('vite');
        const testConfig = require('../../test/test.vite.config');

        build(testConfig.config(this.options()))
            .then(() => {
                grunt.log.writeln('Test bundle built');
                done();
            })
            .catch((err) => {
                grunt.fail.warn(
                    'Vite returned an error: \n' + (err && err.stack ? err.stack : err)
                );
            });
    });
};
