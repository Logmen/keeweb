const fs = require('fs');
const Handlebars = require('handlebars');

// Компилирует .hbs в модуль с шаблоном, привязанным к handlebars/runtime.
// Эквивалент handlebars-loader в webpack-сборке.
module.exports = function handlebarsPlugin() {
    return {
        name: 'keeweb-handlebars',
        transform(code, id) {
            if (!id.endsWith('.hbs')) {
                return null;
            }
            const source = fs.existsSync(id) ? fs.readFileSync(id, 'utf-8') : code;
            const precompiled = Handlebars.precompile(source);
            return {
                code:
                    `import Handlebars from 'hbs';\n` +
                    `export default Handlebars.template(${precompiled});\n`,
                map: null
            };
        }
    };
};
