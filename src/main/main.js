const { app, BrowserWindow, screen, ipcMain } = require("electron");
const Tesseract = require("tesseract.js");

const path = require("path");
const FbManager = require("./fb_reader/fbManager");
let mainWindow = null;
let fbManager = null;

function createWindow() {
  let sizes = screen.getPrimaryDisplay().size;
  mainWindow = new BrowserWindow({
    width: sizes.width,
    height: sizes.height - 10,

    autoHideMenuBar: true,
    icon: path.join(__dirname, "../../icon.ico"),
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInSubFrames: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("src/renderer/index.html");
  mainWindow.on("ready-to-show", () => {
    mainWindow.maximize();
  });

  fbManager = new FbManager(mainWindow);
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("close-app", (e) => {
  mainWindow.close();
});

ipcMain.handle("fb-manager", async (e, args) => {
  let result = await fbManager.handle(args);
  return  result;
});

ipcMain.on('login-required',(e,data)=>{
    mainWindow.webContents.send('login-required',data);
})



ipcMain.handle('fetch-text',async (e,data)=>{
    let results = await Tesseract.recognize(data.dataUrl,'eng')
    return results.data.text;
    
})