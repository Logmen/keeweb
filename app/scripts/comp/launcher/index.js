import { Launcher as ElectronLauncher, initLauncher } from './launcher-electron';

let Launcher;

if (window.process && window.process.versions && window.process.versions.electron) {
    Launcher = ElectronLauncher;
    initLauncher();
}

export { Launcher };
