import { App, app, BrowserWindow, ipcMain, IpcMainInvokeEvent, Menu, Notification } from 'electron';
import path from 'node:path';
import { initDatabase, closeDatabase, getDatabasePath } from "./main/db"
import { registerIpcInvokes } from './main/ipc';
import todoService from './main/todos.service';
import { IPC_CHANNELS, MainLogEvent } from './shared/types';
import { updateElectronApp } from 'update-electron-app';

if (require('electron-squirrel-startup')) app.quit();

updateElectronApp()

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 700,
    minWidth: 720,
    minHeight: 540,
    title: 'Electron Todo Lab',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {


    void mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}


const showNotify = (todosClear: number) => new Notification({
  title: "Todo Lab",
  body: `${todosClear} Completadas han sido eliminadas`
}).show();

app.whenReady().then(() => {
  initDatabase()
  registerIpcInvokes()
  createWindow()

  const menu = Menu.buildFromTemplate([{
    label: app.name,
    submenu: [
      {
        click: () => {
          const todoClear = todoService.clear()
          const data: MainLogEvent = {
            id: crypto.randomUUID(),
            summary: `${todoClear} Completados han sido eliminados`,
            channel: "Menu",
            timestamp: new Date().toISOString()
          }

          const todos = todoService.getTodoList()
          mainWindow?.webContents.send(IPC_CHANNELS.EVENT_MAIN_LOG, data)
          showNotify(todoClear);
          mainWindow?.webContents.send(IPC_CHANNELS.EVENT_TODOS_CHANGED, todos)
        },
        label: 'Limpiar Todos completadas'
      }
    ]
  }])

  Menu.setApplicationMenu(menu)


  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  closeDatabase()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
