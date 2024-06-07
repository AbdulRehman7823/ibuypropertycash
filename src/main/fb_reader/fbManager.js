const { BrowserWindow } = require("electron/main");
const path = require("path");

class FbManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.commonWindow = null;
    this.offscreenWindow = null;

    this.currentData = null;
    this.store = null;
    this.initStore();
    this.createWindow();
  }

  initStore() {
    (async () => {
      const Store = (await import("electron-store")).default;
      this.store = new Store({ name: "campaigns" });
    })();
  }

  read() {
    return this.store.get("data", []);
  }

  write(data) {
    try {
      this.store.set("data", data);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  createWindow() {
    this.offscreenWindow = new BrowserWindow({
      width: 1600,
      height: 1000,
      parent: this.mainWindow,
      show: false,
      webPreferences: {
        offscreen: true,
        devTools: true,
        nodeIntegration: true,
        nodeIntegrationInSubFrames: true,
        preload: path.join(__dirname, "preload.js"),
      },
    });

    this.offscreenWindow.loadURL("https://facebook.com");

    let x = 320;
    let y = 110;
    const maxFactor = 10;
    this.mainWindow.on("resize", () => {
      if (this.commonWindow) {
        x = 310;
        let width = this.mainWindow.getBounds().width - x - maxFactor * 2;
        let height = this.mainWindow.getBounds().height - y - maxFactor * 2;
        let positions = this.mainWindow.getPosition();
        this.commonWindow.setPosition(positions[0] + x, positions[1] + y);
        this.commonWindow.setSize(width, height, true);
        this.commonWindow.setContentSize(width, height, true);
      }
    });
    this.commonWindow = new BrowserWindow({
      width: this.mainWindow.getBounds().width - x - maxFactor * 2,
      height: this.mainWindow.getBounds().height - y - maxFactor * 2,
      frame: false,
      x: x,
      y: y,
      alwaysOnTop: false,
      resizable: false,
      parent: this.mainWindow,
      show: false,
      roundedCorners: true,
      webPreferences: {
        devTools: true,
        nodeIntegration: true,
        nodeIntegrationInSubFrames: true,
        webSecurity: true,
        preload: path.join(__dirname, "commonPreload.js"),
      },
    });

    this.commonWindow.loadURL("https://facebook.com");
    this.mainWindow.on("move", () => {
      let xx = this.mainWindow.getBounds().x;
      let yy = this.mainWindow.getBounds().y;
      this.commonWindow.setPosition(xx + x, yy + y);
    });
  }

  async handle(args) {
    let action = args.action;
    switch (action) {
      case "read":
        let data = this.read();
        return data;
      case "write":
        let result = this.write(args.data);
        return result;
      case "hide":
        this.commonWindow.hide();
        return true;
      case "show":
        this.commonWindow.show();
        return true;
      case "run":
        {
          this.offscreenWindow.webContents.send("init", args.data);
          return true;
        }
        break;

      case "complete":
        {
          this.mainWindow.webContents.send("oncomplete", args.data);
          return true;
        }
        break;

      case "error":
        {
          this.mainWindow.webContents.send("onerror", args.data);
          return true;
        }
        break;

      case "update":
        {
          this.mainWindow.webContents.send("onupdate", args.data);
          return true;
        }
        break;

        case "refresh":
          {
            this.offscreenWindow.reload();
            return true;
          }
          break;
    }
  }
}

module.exports = FbManager;
