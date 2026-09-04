const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

// Компилирует .hbs в модуль с шаблоном, привязанным к handlebars/runtime.
// Эквивалент связки handlebars-loader + string-replace-loader из
// webpack-сборки: сначала схлопываются переводы строк с отступами,
// затем шаблон прекомпилируется со списком известных хелперов.
module.exports = function handlebarsPlugin(rootDir) {
    const helpersDir = path.join(rootDir, 'app/scripts/hbs-helpers');
    const knownHelpers = fs
        .readdirSync(helpersDir)
        .map((f) => f.replace('.js', ''))
        .filter((f) => f !== 'index');

    return {
        name: 'keeweb-handlebars',
        transform(code, id) {
            if (!id.endsWith('.hbs')) {
                return null;
            }
            const source = (fs.existsSync(id) ? fs.readFileSync(id, 'utf-8') : code).replace(
                /\r?\n\s*/g,
                '\n'
            );
            const precompiled = Handlebars.precompile(source, { knownHelpers });
            return {
                code:
                    `import Handlebars from 'hbs';\n` +
                    `export default Handlebars.template(${precompiled});\n`,
                map: null
            };
        }
    };
};
