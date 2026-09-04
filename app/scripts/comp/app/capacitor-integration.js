import { Events } from 'framework/events';
import { Logger } from 'util/logger';

const logger = new Logger('capacitor');

// Интеграция с Android-оболочкой на Capacitor. Всё, что здесь, включается
// только внутри нативного приложения: в браузере и Electron модуль — no-op.
//
// Системная кнопка «назад» в WebView по умолчанию закрывает приложение. Здесь
// она ведёт по иерархии экранов KeeWeb, как принято на Android: диалог ->
// боковое меню -> настройки -> детали записи -> список, и только с корневого
// экрана уходит в фон, не убивая приложение (открытую базу защищает
// автоблокировка).

function capacitor() {
    const cap = window.Capacitor;
    if (!cap || typeof cap.isNativePlatform !== 'function' || !cap.isNativePlatform()) {
        return null;
    }
    return cap;
}

function appPlugin(cap) {
    return (cap.Plugins && cap.Plugins.App) || null;
}

function closeOpenModal() {
    const modal = document.querySelector('.modal:not(.modal--hidden)');
    if (!modal) {
        return false;
    }
    // диалоги KeeWeb закрываются по Escape (кнопка, назначенная как esc)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, which: 27 }));
    return true;
}

function handleBackButton(app) {
    if (closeOpenModal()) {
        return;
    }
    const menu = document.querySelector('.app__menu.menu-visible');
    if (menu) {
        Events.emit('toggle-menu', false);
        return;
    }
    if (document.querySelector('.settings')) {
        Events.emit('toggle-settings', false);
        return;
    }
    if (document.querySelector('.app--details-visible')) {
        Events.emit('toggle-details', false);
        return;
    }
    const hasOpenFile = !!document.querySelector('.list');
    if (hasOpenFile) {
        app.minimizeApp();
    } else {
        app.exitApp();
    }
}

// Тап по затемнению рядом с выезжающим меню закрывает его — сам KeeWeb
// закрывает меню только по выбору пункта или по кнопке-гамбургеру.
function closeMenuOnScrimTap() {
    document.addEventListener(
        'click',
        (e) => {
            const menu = document.querySelector('.app__menu.menu-visible');
            if (!menu) {
                return;
            }
            // затемнение — псевдоэлемент ::after самого меню, поэтому тап по нему
            // приходит с target === menu; отличаем его от тапа внутри панели
            // по координате: панель занимает левую часть экрана
            const onScrim = e.target === menu && e.clientX >= menu.getBoundingClientRect().right;
            const insideMenu = e.target !== menu && menu.contains(e.target);
            if (insideMenu || (!onScrim && e.target === menu)) {
                return;
            }
            if (e.target.closest('.list__search-btn-menu')) {
                return;
            }
            Events.emit('toggle-menu', false);
        },
        true
    );
}

const CapacitorIntegration = {
    init() {
        const cap = capacitor();
        if (!cap) {
            return;
        }
        const app = appPlugin(cap);
        if (!app) {
            logger.warn('App plugin is not available');
            return;
        }
        app.addListener('backButton', () => handleBackButton(app));
        // уход в фон = сворачивание: app-view заблокирует базу, если включено
        // «блокировать при сворачивании», как это делает десктопная версия
        app.addListener('appStateChange', ({ isActive }) => {
            if (!isActive) {
                Events.emit('app-minimized');
            }
        });
        closeMenuOnScrimTap();
        logger.info('Initialized for', cap.getPlatform());
    }
};

export { CapacitorIntegration };
