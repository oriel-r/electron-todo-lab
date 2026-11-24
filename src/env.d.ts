import type { ElectronAPI } from './shared/types';

if (require('electron-squirrel-startup')) app.quit();

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export { };
