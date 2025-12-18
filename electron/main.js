const { app, BrowserWindow, protocol, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')
const fs = require('fs')

let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  })

  const startUrl = process.env.ELECTRON_START_URL || (isDev ? 'http://localhost:3000' : 'https://your-deployed-app.example.com')
  mainWindow.loadURL(startUrl)

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }
}

app.on('ready', () => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// IPC handler to save files from renderer (expects base64 data)
ipcMain.handle('save-file', async (event, { data, defaultName }) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: defaultName || 'export.pdf',
    })
    if (canceled || !filePath) return { canceled: true }

    // data expected to be base64 string
    const buffer = Buffer.from(data, 'base64')
    await fs.promises.writeFile(filePath, buffer)
    return { canceled: false, filePath }
  } catch (err) {
    console.error('save-file error:', err)
    return { canceled: true, error: err?.message }
  }
})

// IPC to show the saved file in the OS file manager
ipcMain.handle('show-item-in-folder', async (event, filePath) => {
  try {
    if (!filePath) return { success: false, error: 'No filePath provided' }
    // showItemInFolder returns void; wrap in try/catch
    shell.showItemInFolder(filePath)
    return { success: true }
  } catch (err) {
    console.error('show-item-in-folder error:', err)
    return { success: false, error: err?.message }
  }
})
