const fs = require('fs');
const path = require('path');

const inject = require('@rollup/plugin-inject');

const handlebarsPlugin = require('./vite-plugins/handlebars');
const rawFilesPlugin = require('./vite-plugins/raw-files');
const fontawesomePlugin = require('./vite-plugins/fontawesome');
const appModulesPlugin = require('./vite-plugins/app-modules');
const runtimeInfoPlugin = require('./vite-plugins/runtime-info');
const baronPlugin = require('./vite-plugins/baron');

const rootDir = path.join(__dirname, '..');
const pkg = require('../package.json');

const emptyModule = path.join(__dirname, 'vite-plugins/empty-module.js');
const iconFontScssPath = path.resolve(rootDir, 'app/styles/base/_icon-font.scss');

// Аналог scss-add-icons-loader: дописывает правила .fa-* по списку $fa-var-*.
function appendIconRules(source) {
    const iconFontScss = fs.readFileSync(iconFontScssPath, 'utf-8');
    const rules = [...iconFontScss.matchAll(/\n\$fa-var-([\w-]+):/g)]
        .map(([, name]) => name)
        .map((icon) => `.fa-${icon}:before { content: $fa-var-${icon}; }`)
        .join('\n');
    return source + '\n' + rules;
}

function config(options) {
    const devMode = (options.mode || 'production') === 'development';
    const year = options.date.getFullYear();
    const min = devMode ? '' : '.min';

    const banner =
        `/*! keeweb v${pkg.version}, (c) ${year} ${pkg.author.name}, ` +
        `opensource.org/licenses/${pkg.license} */`;

    return {
        root: rootDir,
        mode: devMode ? 'development' : 'production',
        configFile: false,
        logLevel: 'info',
        resolve: {
            alias: {
                jquery: path.join(rootDir, `node_modules/jquery/dist/jquery${min}.js`),
                morphdom: `morphdom/dist/morphdom-umd${min}.js`,
                kdbxweb: `kdbxweb/dist/kdbxweb${min}.js`,
                baron: `baron/baron${min}.js`,
                qrcode: `jsqrcode/dist/qrcode${min}.js`,
                argon2: 'argon2-browser/dist/argon2.js',
                dompurify: `dompurify/dist/purify${min}.js`,
                tweetnacl: `tweetnacl/nacl${min}.js`,
                hbs: 'handlebars/runtime.js',
                'argon2-wasm': path.join(rootDir, 'node_modules/argon2-browser/dist/argon2.wasm'),
                templates: path.join(rootDir, 'app/templates'),
                'public-key.pem': path.join(rootDir, 'app/resources/public-key.pem'),
                'public-key-new.pem': path.join(rootDir, 'app/resources/public-key-new.pem'),
                'demo.kdbx': path.join(rootDir, 'app/resources/Demo.kdbx'),
                // в вебе этих модулей нет — webpack отдавал 'null' через externals
                xmldom: emptyModule,
                moment: emptyModule,
                crypto: emptyModule,
                fs: emptyModule,
                path: emptyModule
            }
        },
        // webpack полифиллил global в браузере, Vite — нет; в коде есть
        // обращения вида global.WebAssembly
        define: {
            global: 'globalThis'
        },
        css: {
            preprocessorOptions: {
                scss: {
                    // sass-loader понимал префикс '~' как «искать в node_modules»;
                    // Dart Sass сам так не умеет, поэтому резолвим вручную
                    importers: [
                        {
                            findFileUrl(url) {
                                if (!url.startsWith('~')) {
                                    return null;
                                }
                                const target = path.join(rootDir, 'node_modules', url.slice(1));
                                // пакет может объявлять точку входа для стилей
                                // в package.json (поля sass / style)
                                const pkgJson = path.join(target, 'package.json');
                                if (fs.existsSync(target) && fs.existsSync(pkgJson)) {
                                    const meta = JSON.parse(fs.readFileSync(pkgJson, 'utf-8'));
                                    const entry = meta.sass || meta.style;
                                    if (entry) {
                                        return new URL(`file://${path.join(target, entry)}`);
                                    }
                                }
                                return new URL(`file://${target}`);
                            }
                        }
                    ],
                    additionalData: (source, filename) =>
                        filename.endsWith('main.scss') ? appendIconRules(source) : source
                }
            }
        },
        plugins: [
            appModulesPlugin(rootDir),
            rawFilesPlugin(),
            handlebarsPlugin(rootDir),
            baronPlugin(),
            runtimeInfoPlugin({
                VERSION: pkg.version + (options.beta ? '-beta' : ''),
                BETA: options.beta ? '1' : '',
                DATE: options.date.toISOString().replace(/T.*/, ''),
                COMMIT: options.sha,
                DEVMODE: devMode ? '1' : '',
                APPLE_TEAM_ID: options.appleTeamId
            }),
            fontawesomePlugin(),
            inject({ $: path.join(rootDir, `node_modules/jquery/dist/jquery${min}.js`) })
        ],
        build: {
            outDir: path.join(rootDir, 'tmp'),
            emptyOutDir: false,
            sourcemap: devMode ? 'inline' : false,
            // грант-таск inline ожидает отдельный css/app.css, как отдавал webpack
            cssCodeSplit: false,
            minify: !devMode,
            cssMinify: !devMode,
            target: 'es2020',
            reportCompressedSize: false,
            rollupOptions: {
                input: {
                    app: path.join(__dirname, 'vite-entry.js')
                },
                output: {
                    format: 'iife',
                    entryFileNames: 'js/app.js',
                    assetFileNames: (info) =>
                        (info.name || '').endsWith('.css')
                            ? 'css/app.css'
                            : 'assets/[name][extname]',
                    banner
                }
            }
        }
    };
}

module.exports.config = config;
