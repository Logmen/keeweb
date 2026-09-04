module.exports = function (grunt) {
    grunt.registerMultiTask('vite-dev', 'Builds in watch mode and serves the app', function () {
        // задача не завершается: сервер живёт до остановки grunt
        this.async();
        const { build, preview } = require('vite');
        const viteConfig = require('../vite.config');
        const options = this.options();

        const config = viteConfig.config({ ...options, mode: 'development', sha: 'dev' });
        config.build.watch = {};

        build(config)
            .then(() =>
                preview({
                    root: config.root,
                    build: { outDir: config.build.outDir },
                    preview: { port: options.port || 8085, strictPort: true }
                })
            )
            .then((server) => {
                const url = (server.resolvedUrls && server.resolvedUrls.local[0]) || '?';
                grunt.log.writeln(`Dev server listening at ${url}`);
            })
            .catch((err) => {
                grunt.fail.warn(
                    'Vite dev returned an error: \n' + (err && err.stack ? err.stack : err)
                );
            });
    });
};
