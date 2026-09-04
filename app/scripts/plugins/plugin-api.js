import kdbxweb from 'kdbxweb';
import hbs from 'hbs';
import pikaday from 'pikaday';
import qrcode from 'jsqrcode';

const Libs = {
    kdbxweb,
    hbs,
    pikaday,
    qrcode
};

// Плагины обращаются к модулям приложения по пути. В webpack это был
// context module через require('../' + module); в Vite эквивалент —
// import.meta.glob с eager, дающий синхронную карту.
// Каталог plugins исключён: plugin.js импортирует этот модуль, и жадная
// загрузка замыкала бы цикл (в webpack context-модуль был ленивым).
const appModules = import.meta.glob(['../**/*.js', '!../plugins/**'], { eager: true });

const PluginApi = {
    require(module) {
        return Libs[module] || appModules[`../${module}.js`] || appModules[`../${module}`];
    }
};

export { PluginApi };
