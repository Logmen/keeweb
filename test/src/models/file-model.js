import { expect } from 'chai';
import * as kdbxweb from 'kdbxweb';
import { FileModel } from 'models/file-model';
import keyOnlyDbBase64 from 'test/fixtures/key-only.kdbx';

// База создана только с 32-байтовым бинарным ключ-файлом, без пароля (как это
// делают KeePass и KeePassXC). Ключ — байты файла, hex.
const KEY_FILE_HEX = '828bd036367f10eebf85ac7e8e64d66d6c4476cd1e5ca14821d64ad04126b0d8';

function hexToArrayBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes.buffer;
}

function base64ToArrayBuffer(base64) {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
    }
    return bytes.buffer;
}

function openWith(password) {
    return new Promise((resolve) => {
        const file = new FileModel({ id: 'key-only-test' });
        file.open(
            password,
            base64ToArrayBuffer(keyOnlyDbBase64),
            hexToArrayBuffer(KEY_FILE_HEX),
            (err) => resolve({ err, file })
        );
    });
}

describe('FileModel.open with a key file and no password', () => {
    it('opens with null password', async () => {
        const { err, file } = await openWith(null);
        expect(err).to.be.undefined;
        expect(file.db.getDefaultGroup().entries[0].fields.get('Title')).to.eql('probe');
    });

    it('opens with an empty password by falling back to null', async () => {
        // первая попытка с пустой строкой даёт InvalidKey; повтор с null должен
        // получить нетронутый буфер ключа, а не XOR-нутый первой попыткой
        const { err, file } = await openWith(kdbxweb.ProtectedValue.fromString(''));
        expect(err).to.be.undefined;
        expect(file.passwordLength).to.eql(0);
    });

    it('opens when the key file comes as a Uint8Array, as on desktop', async () => {
        // Launcher.readFile в Electron отдаёт Uint8Array, а не ArrayBuffer; первая
        // попытка (null) для этого файла неверна и не должна портить ключ для второй
        const key = new Uint8Array(hexToArrayBuffer(KEY_FILE_HEX));
        const { err } = await new Promise((resolve) => {
            const file = new FileModel({ id: 'key-u8-test' });
            file.open(
                kdbxweb.ProtectedValue.fromString(''),
                base64ToArrayBuffer(keyOnlyDbBase64),
                key,
                (e) => resolve({ err: e, file })
            );
        });
        expect(err).to.be.undefined;
    });

    it('does not corrupt the key buffer passed by the caller', async () => {
        const key = hexToArrayBuffer(KEY_FILE_HEX);
        const before = Array.from(new Uint8Array(key));
        await new Promise((resolve) => {
            new FileModel({ id: 'key-buf-test' }).open(
                kdbxweb.ProtectedValue.fromString(''),
                base64ToArrayBuffer(keyOnlyDbBase64),
                key,
                resolve
            );
        });
        // после успешного открытия модель обнуляет ключ сама — это ожидаемо;
        // важно, что до успеха ключ не был испорчен промежуточной попыткой
        const after = Array.from(new Uint8Array(key));
        expect(after.every((b) => b === 0) || after.join() === before.join()).to.eql(true);
    });
});
