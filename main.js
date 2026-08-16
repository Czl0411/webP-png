const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('node:path');

const { convertDirectory } = require('./converter');

function createWindow() {
  const window = new BrowserWindow({
    width: 680,
    height: 300,
    resizable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  window.removeMenu();
  window.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  ipcMain.handle('choose-folder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('convert-directory', (_, sourceDir, outputDir) => {
    if (!sourceDir || !outputDir) {
      throw new Error('请选择源文件夹和输出文件夹');
    }

    return convertDirectory(sourceDir, outputDir);
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
