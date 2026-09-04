const { minify } = require('html-minifier-terser');

module.exports = function (grunt) {
    grunt.registerMultiTask('htmlmin', 'Minifies HTML using html-minifier-terser', function () {
        const done = this.async();
        const options = this.options();

        Promise.all(
            this.files.map(async (file) => {
                const src = file.src.filter((path) => grunt.file.exists(path));
                if (!src.length) {
                    grunt.warn(`Source file not found: ${file.src}`);
                    return;
                }
                const html = src.map((path) => grunt.file.read(path)).join('');
                const minified = await minify(html, options);
                grunt.file.write(file.dest, minified);
            })
        )
            .then(() => {
                grunt.log.writeln(`Minified ${this.files.length} files`);
                done();
            })
            .catch((err) => {
                grunt.fail.warn('html-minifier-terser returned an error: \n' + err);
            });
    });
};
