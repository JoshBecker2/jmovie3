const { contextBridge, ipcRenderer } = require('electron');

// allow the front end to use these functions through the jm api
contextBridge.exposeInMainWorld('jm', {
  uploadFileToApp: (fileName, dataArray) => ipcRenderer.invoke('uploadFileToApp', fileName, dataArray),
  writeFileContent: (fileName, content) => ipcRenderer.invoke('writeFileContent', fileName, content),
  saveSettings: (updatedConfig) => ipcRenderer.invoke('saveSettings', updatedConfig),
  loadFileContent: (filePath) => ipcRenderer.invoke('loadFileContent', filePath),
  updateFilter: (strength) => ipcRenderer.invoke('updateFilter', strength),
  getEmbedURLs: (isShow) => ipcRenderer.invoke('getEmbedURLs', isShow),
  loadBlackLists: () => ipcRenderer.invoke('loadBlackLists'),
  resetSettings: () => ipcRenderer.invoke('resetSettings'),
  tmdbSearch: (q) => ipcRenderer.invoke('tmdbSearch', q),
  resetSearch: () => ipcRenderer.invoke('resetSearch'),
  fetchConfig: () => ipcRenderer.invoke('fetchConfig'),
  addLog: (msg) => ipcRenderer.invoke('addLog', msg),
  closeApp: () => ipcRenderer.invoke("close-app"),
  fetchLogs: () => ipcRenderer.invoke('fetchLogs'),
  clearLogs: () => ipcRenderer.invoke('clearLogs')
});