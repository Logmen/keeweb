const fs = require('fs');
const path = require('path');

const SVGIcons2SVGFontStream = require('svgicons2svgfont');
const svg2ttf = require('svg2ttf');
const wawoff2 = require('wawoff2');

// Собирает подмножество веб-шрифта из SVG по списку $fa-var-* в _icon-font.scss.
// Эквивалент build/loaders/fontawesome-loader.js из webpack-сборки.
const VIRTUAL_ID = 'virtual:fontawesome-woff2';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

const svgBaseDir = path.resolve('node_modules/@fortawesome/fontawesome-free/svgs/');
const iconFontScssPath = path.resolve('app/styles/base/_icon-font.scss');

function collectAllIcons() {
    const dirs = ['brands', 'regular', 'solid']
        .map((dir) => path.join(svgBaseDir, dir))
        .concat('graphics/svg');
    const allIcons = {};
    for (const svgDir of dirs) {
        const suffix = svgDir.endsWith('regular') ? '-o' : '';
        for (const icon of fs.readdirSync(svgDir).filter((i) => i.endsWith('.svg'))) {
            allIcons[icon.slice(0, -4) + suffix] = path.join(svgDir, icon);
        }
    }
    return allIcons;
}

function includedIconNames(scssSource) {
    return [...scssSource.matchAll(/\n\$fa-var-([\w-]+):/g)].map(([, name]) => name);
}

function buildFont(allIcons, iconNames, addWatchFile) {
    const seen = new Set();
    for (const iconName of iconNames) {
        if (seen.has(iconName)) {
            throw new Error(`Duplicate icon: $fa-var-${iconName}`);
        }
        if (!allIcons[iconName]) {
            throw new Error(`Icon not found: "${iconName}"`);
        }
        seen.add(iconName);
    }

    const fontStream = new SVGIcons2SVGFontStream({
        fontName: 'Font Awesome 7 Free',
        round: 10e12,
        log() {}
    });
    const chunks = [];
    fontStream.on('data', (chunk) => chunks.push(chunk));

    let charCode = 0xf000;
    for (const iconName of iconNames) {
        ++charCode;
        const svgIconPath = allIcons[iconName];
        addWatchFile(svgIconPath);
        const glyph = fs.createReadStream(svgIconPath);
        glyph.metadata = { name: iconName, unicode: [String.fromCharCode(charCode)] };
        fontStream.write(glyph);
    }
    fontStream.end();

    return new Promise((resolve, reject) => {
        fontStream.on('end', async () => {
            try {
                let data = Buffer.concat(chunks);
                data = Buffer.from(svg2ttf(data.toString('utf8')).buffer);
                data = Buffer.from(await wawoff2.compress(data));
                resolve(data);
            } catch (ex) {
                reject(ex);
            }
        });
    });
}

async function buildFontDataUri(addWatchFile) {
    const scssSource = fs.readFileSync(iconFontScssPath, 'utf-8');
    const iconNames = includedIconNames(scssSource);
    const fontData = await buildFont(collectAllIcons(), iconNames, addWatchFile);
    return {
        dataUri: `data:font/woff2;base64,${fontData.toString('base64')}`,
        iconsCount: iconNames.length,
        kb: (fontData.byteLength / 1024).toFixed(2)
    };
}

module.exports = function fontawesomePlugin() {
    return [
        {
            name: 'keeweb-fontawesome-resolve',
            enforce: 'pre',
            resolveId(id) {
                return id === VIRTUAL_ID ? RESOLVED_ID : null;
            },
            async load(id) {
                if (id !== RESOLVED_ID) {
                    return null;
                }
                this.addWatchFile(iconFontScssPath);
                const { dataUri } = await buildFontDataUri((f) => this.addWatchFile(f));
                return `export default ${JSON.stringify(dataUri)};`;
            }
        },
        {
            // Шрифт подключается из SCSS через url('fontawesome.woff2'), такие
            // ссылки Vite резолвит как ассеты, минуя JS-плагины. Поэтому
            // подставляем data-URI в уже готовый CSS. enforce:'post' обязателен:
            // CSS-ассет создаёт vite:css-post, который иначе ещё не отработал.
            name: 'keeweb-fontawesome-inline',
            enforce: 'post',
            async generateBundle(outputOptions, bundle) {
                const cssAssets = Object.values(bundle).filter(
                    (asset) => asset.type === 'asset' && asset.fileName.endsWith('.css')
                );
                if (!cssAssets.length) {
                    return;
                }
                const { dataUri, iconsCount, kb } = await buildFontDataUri(() => {});
                let replaced = 0;
                for (const asset of cssAssets) {
                    asset.source = asset.source
                        .toString()
                        .replace(/url\(([^)]*fontawesome\.woff2)\)/g, () => {
                            replaced++;
                            return `url(${dataUri})`;
                        });
                }
                if (!replaced) {
                    this.error('fontawesome.woff2 не найден в CSS — шрифт иконок не подключён');
                }
                this.info(`fontawesome.woff2: ${iconsCount} icons, ${kb} KiB, ${replaced} ref`);
            }
        }
    ];
};

module.exports.VIRTUAL_ID = VIRTUAL_ID;
