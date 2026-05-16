import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './db.js';
import { setupIpcHandlers } from './ipc.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1280,
    minHeight: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  initializeDatabase();
  setupIpcHandlers();
  createWindow();

  app.setAboutPanelOptions({
    applicationName: 'Cue Club Manager',
    applicationVersion: '1.0.0',
    version: '1.0.0',
    copyright: '© 2025 BR7 Technologies & Co.\nAll rights reserved.\n\nbr7tech.dev\nhello@br7tech.dev\n\nPrivacy Policy & Terms: br7tech.dev/legal',
    website: 'https://br7tech.dev',
  });

  ipcMain.handle('app:showAbout', () => {
    app.showAboutPanel();
  });

  ipcMain.handle('app:openLegal', (_e, page) => {
    const urls = {
      privacy: 'https://br7tech.dev/privacy',
      terms: 'https://br7tech.dev/terms',
      contact: 'mailto:hello@br7tech.dev',
    };
    if (urls[page]) shell.openExternal(urls[page]);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
