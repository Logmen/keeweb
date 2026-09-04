const path = require('path');

const viteConfig = require('../build/vite.config');

const rootDir = path.join(__dirname, '..');

// Тестовый бандл собирается тем же конвейером, что и приложение:
// те же алиасы, плагины и резолв, только другая точка входа и вывод.
function config(options) {
    const appConfig = viteConfig.config({ ...options, mode: 'development', sha: 'tests' });

    appConfig.resolve.alias.test = path.join(rootDir, 'test');
    appConfig.build = {
        ...appConfig.build,
        outDir: path.join(rootDir, 'test/dist'),
        cssCodeSplit: false,
        minify: false,
        sourcemap: true,
        rollupOptions: {
            input: { test: path.join(rootDir, 'test/index.js') },
            output: {
                format: 'iife',
                entryFileNames: 'test.bundle.js',
                assetFileNames: 'test.bundle[extname]'
            }
        }
    };
    return appConfig;
}

module.exports.config = config;
