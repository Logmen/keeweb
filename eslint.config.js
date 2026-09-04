const js = require('@eslint/js');
const neostandard = require('neostandard');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const importPlugin = require('eslint-plugin-import');
const globals = require('globals');

// Flat config пришёл на смену .eslintrc: eslint 9 читает только его.
// Набор правил перенесён из прежнего .eslintrc без изменений; конфиг
// standard заменён на neostandard — прежний не поддерживает eslint 9.
module.exports = [
    { ignores: ['node_modules/**', 'dist/**', 'tmp/**', 'test/dist/**'] },
    js.configs.recommended,
    ...neostandard({ noStyle: true }),
    prettierConfig,
    {
        plugins: { prettier: prettierPlugin, import: importPlugin },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                ...globals.browser,
                ...globals.node,
                _: 'readonly',
                $: 'readonly'
            }
        },
        rules: {
            semi: ['error', 'always'],
            'one-var': 'off',
            'space-before-function-paren': 'off',
            'no-throw-literal': 'off',
            camelcase: ['error', { properties: 'always' }],
            'no-console': 'error',
            'no-alert': 'error',
            'no-debugger': 'error',
            'prefer-arrow-callback': 'error',
            'object-property-newline': 'off',
            'no-useless-escape': 'off',
            'no-var': 'error',
            'prefer-const': 'error',
            'no-unused-expressions': 'error',
            strict: ['error', 'never'],
            'no-mixed-operators': 'off',
            'prefer-promise-reject-errors': 'off',
            'object-curly-spacing': 'off',
            'quote-props': 'off',
            'no-new-object': 'error',
            // опции заданы явно: указание одного лишь уровня сохранило бы
            // 'properties' от neostandard, и правило перестало бы ловить
            // методы вида foo: function () {} — а на этом держится код,
            // уходящий в воркер через .toString() (см. kdbxweb-init.js)
            'object-shorthand': ['error', 'always'],
            'no-array-constructor': 'error',
            'array-callback-return': 'error',
            'no-eval': 'error',
            'no-new-func': 'error',
            'prefer-rest-params': 'error',
            'prefer-spread': 'error',
            'no-useless-constructor': 'error',
            'no-dupe-class-members': 'error',
            'no-duplicate-imports': 'error',
            eqeqeq: 'error',
            'no-unneeded-ternary': 'error',
            curly: 'error',
            'prettier/prettier': 'error',
            'no-empty': 'off',
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'ExportDefaultDeclaration',
                    message: 'Prefer named exports'
                }
            ],
            // в прежнем .eslintrc это правило было отключено как
            // standard/no-callback-literal и node/no-callback-literal
            'n/no-callback-literal': 'off',
            'import/no-webpack-loader-syntax': 'off',
            'import/no-relative-parent-imports': 'error',
            'import/first': 'error',
            'import/no-default-export': 'error'
        }
    },
    {
        // код приложения, тесты и точка входа Vite — ES-модули;
        // сборочные скрипты и desktop/ остаются CommonJS
        files: [
            'app/scripts/**/*.js',
            'test/**/*.js',
            'build/vite-entry.js',
            'build/vite-plugins/empty-module.js'
        ],
        languageOptions: { sourceType: 'module' }
    },
    {
        // из прежнего app/scripts/.eslintrc
        files: ['app/scripts/**/*.js'],
        rules: { 'import/no-commonjs': 'error' }
    },
    {
        // из прежнего test/.eslintrc
        files: ['test/**/*.js'],
        languageOptions: { globals: { ...globals.mocha } },
        rules: { 'no-unused-expressions': 'off' }
    },
    {
        // из прежнего package/osx/.eslintrc: это JXA-скрипт для macOS,
        // ES5 со своими глобалями (root: true отключал общие правила)
        files: ['package/osx/**/*.js'],
        languageOptions: {
            ecmaVersion: 5,
            sourceType: 'script',
            globals: { ...globals.applescript }
        },
        rules: {
            'no-console': 'off',
            'no-unused-vars': 'error',
            'no-undef': 'error',
            'no-var': 'off',
            'object-shorthand': 'off',
            'prefer-arrow-callback': 'off',
            'prefer-const': 'off',
            'prefer-spread': 'off',
            'prefer-rest-params': 'off'
        }
    }
];
