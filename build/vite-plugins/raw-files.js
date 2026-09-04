const fs = require('fs');
const path = require('path');

// .pem и argon2*.js подключаются как текст, .wasm и .kdbx — как base64.
// Эквивалент raw-loader / base64-loader в webpack-сборке.
// Отдельно поддержан webpack-синтаксис '!!raw-loader!<путь>', который
// остался в app/scripts/plugins/theme-vars.js.
const RAW_LOADER_PREFIX = '!!raw-loader!';

module.exports = function rawFilesPlugin() {
    const rawRe = /\.pem$/;
    const argon2Re = /argon2(\.min)?\.js$/;
    const base64Re = /\.(wasm|kdbx)$/;

    return {
        name: 'keeweb-raw-files',
        enforce: 'pre',
        resolveId(source, importer) {
            if (!source.startsWith(RAW_LOADER_PREFIX)) {
                return null;
            }
            const target = source.slice(RAW_LOADER_PREFIX.length);
            const base = importer ? path.dirname(importer) : process.cwd();
            // ?raw — штатный механизм Vite: файл подключается как строка,
            // минуя css-конвейер
            return path.resolve(base, target) + '?raw';
        },
        load(id) {
            if (id.endsWith('?raw')) {
                return null;
            }
            const file = id.split('?')[0];
            if (rawRe.test(file) || argon2Re.test(file)) {
                return `export default ${JSON.stringify(fs.readFileSync(file, 'utf-8'))};`;
            }
            if (base64Re.test(file)) {
                return `export default ${JSON.stringify(
                    fs.readFileSync(file).toString('base64')
                )};`;
            }
            return null;
        }
    };
};
