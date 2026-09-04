import { Timeouts } from 'const/timeouts';
import { Alerts } from 'comp/ui/alerts';
import { Locale } from 'util/locale';
import { Logger } from 'util/logger';

const logger = new Logger('file-saver');

// В Android-обёртке на Capacitor WebView не умеет скачивать файлы: ссылка
// с атрибутом download молча ничего не делает. Там пишем через нативный
// плагин Filesystem в папку Documents — её видит любой файловый менеджер.
function capacitorFilesystem() {
    const cap = window.Capacitor;
    if (!cap || typeof cap.isNativePlatform !== 'function' || !cap.isNativePlatform()) {
        return null;
    }
    return (cap.Plugins && cap.Plugins.Filesystem) || null;
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

const FileSaver = {
    saveAs(blob, name) {
        const filesystem = capacitorFilesystem();
        if (filesystem) {
            this.saveWithCapacitor(filesystem, blob, name);
            return;
        }

        const link = document.createElement('a');

        link.download = name;
        link.rel = 'noopener';
        link.href = URL.createObjectURL(blob);

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);

        setTimeout(() => {
            URL.revokeObjectURL(link.href);
        }, Timeouts.LinkDownloadRevoke);
    },

    async saveWithCapacitor(filesystem, blob, name) {
        try {
            const data = await blobToBase64(blob);
            const result = await filesystem.writeFile({
                path: name,
                data,
                directory: 'DOCUMENTS',
                recursive: true
            });
            logger.info('File saved', result.uri);
            Alerts.info({
                header: Locale.fileSaverSavedHeader,
                body: Locale.fileSaverSavedBody.replace('{}', name)
            });
        } catch (e) {
            logger.error('Error saving file', e);
            Alerts.error({
                header: Locale.fileSaverErrorHeader,
                body: String(e)
            });
        }
    }
};

export { FileSaver };
