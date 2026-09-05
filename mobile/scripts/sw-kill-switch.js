/* eslint-disable no-console */
// Обычный service worker KeeWeb кладёт index.html (а в него инлайнится всё
// приложение) в кэш и обновляется только при смене своих байтов. В WebView он
// переживает обновление APK, и пользователь остаётся на первой установленной
// сборке. Первые Android-сборки его регистрировали, поэтому в ассеты вместо него
// кладётся worker-«ликвидатор»: байты другие — WebView его установит, а он снесёт
// кэш, снимет регистрацию и перезагрузит окно, чтобы загрузился свежий index.html.
// Запускается Capacitor CLI как хук capacitor:copy:after / capacitor:sync:after.
const fs = require('fs');
const path = require('path');

const target = path.join(
    __dirname,
    '..',
    'android',
    'app',
    'src',
    'main',
    'assets',
    'public',
    'service-worker.js'
);

const worker = `// KeeWeb для Android: этот service worker только убирает следы прежнего —
// кэш с index.html и саму регистрацию — и перезагружает окно приложения.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
            await self.registration.unregister();
            const clients = await self.clients.matchAll({ type: 'window' });
            await Promise.all(clients.map((client) => client.navigate(client.url).catch(() => {})));
        })()
    );
});
`;

if (fs.existsSync(path.dirname(target))) {
    fs.writeFileSync(target, worker);
    console.log('[sw-kill-switch] service-worker.js заменён на ликвидатор:', target);
} else {
    console.log('[sw-kill-switch] нет каталога ассетов, пропуск:', path.dirname(target));
}
