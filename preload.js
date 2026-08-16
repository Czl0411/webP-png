const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('webpTool', {
  chooseFolder: () => ipcRenderer.invoke('choose-folder'),
  convert: (sourceDir, outputDir) => ipcRenderer.invoke('convert-directory', sourceDir, outputDir),
});
