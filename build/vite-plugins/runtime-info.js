// Подставляет @@VERSION и соседние плейсхолдеры в const/runtime-info.js.
// Эквивалент правила string-replace-loader из webpack-сборки.
module.exports = function runtimeInfoPlugin(values) {
    return {
        name: 'keeweb-runtime-info',
        transform(code, id) {
            if (!/runtime-info\.js$/.test(id)) {
                return null;
            }
            let result = code;
            for (const [key, value] of Object.entries(values)) {
                result = result.split(`@@${key}`).join(value === undefined ? '' : String(value));
            }
            return { code: result, map: null };
        }
    };
};
