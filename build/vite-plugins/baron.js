// baron — webpack-бандл, вешающий себя на window и не имеющий экспортов,
// которые смог бы распознать Rollup. В webpack-сборке этим занимались
// string-replace-loader и exports-loader.
module.exports = function baronPlugin() {
    return {
        name: 'keeweb-baron',
        transform(code, id) {
            if (!/baron(\.min)?\.js$/.test(id)) {
                return null;
            }
            const patched = code.replace(/\(1,\s*eval\)\('this'\)/g, 'window');
            return {
                code: `${patched}\nexport default window.baron;\n`,
                map: null
            };
        }
    };
};
