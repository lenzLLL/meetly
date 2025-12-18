const { contextBridge, ipcRenderer } = require('electron')

// Expose a minimal safe API to the renderer
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  versions: process.versions,
  // Save a base64-encoded file via native file dialog. Returns { canceled, filePath }
  saveFile: async (base64Data, defaultName) => {
    return await ipcRenderer.invoke('save-file', { data: base64Data, defaultName })
  }
  ,
  // Show the saved file in the OS file manager (returns { success })
  showItemInFolder: async (filePath) => {
    return await ipcRenderer.invoke('show-item-in-folder', filePath)
  }
})
