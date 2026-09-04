const fs = require('fs');
const path = require('path');

// В webpack голые импорты вроде 'framework/events' или 'main.scss' резолвились
// через resolve.modules. В Vite такого механизма нет, поэтому ищем сами.
module.exports = function appModulesPlugin(rootDir) {
    const roots = [path.join(rootDir, 'app/scripts'), path.join(rootDir, 'app/styles')];
    const extensions = ['', '.js', '.json', '.scss', '.css'];

    return {
        name: 'keeweb-app-modules',
        resolveId(source, importer) {
            if (source.startsWith('.') || source.startsWith('/') || source.startsWith('\0')) {
                return null;
            }
            for (const root of roots) {
                for (const ext of extensions) {
                    const candidate = path.join(root, source + ext);
                    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
                        return candidate;
                    }
                }
                const asIndex = path.join(root, source, 'index.js');
                if (fs.existsSync(asIndex)) {
                    return asIndex;
                }
            }
            return null;
        }
    };
};
