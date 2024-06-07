const { ipcRenderer } = require("electron");
const CommentReader = require("./CommentReader");

function onComplete(config) {
  ipcRenderer.invoke("fb-manager", { action: "complete", data: config });
}

function onError(error) {
  ipcRenderer.invoke("fb-manager", { action: "error", data: error });
}

function onUpdate(data) {
  ipcRenderer.invoke("fb-manager", { action: "update", data: data });
}

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

ipcRenderer.on("init", async (event, config) => {
  config.onComplete = onComplete;
  config.onupdate = onUpdate;
  config.onerror = onError;
  config.actionDelay = 6000;
  if (!checkFacebookIsLoggedIn()) {
    ipcRenderer.send("login-required", { id: config.id });
    return;
  }
  setTimeout(() => {
    CommentReader.init({}, config);
  }, config.actionDelay);
});

function checkFacebookIsLoggedIn() {
  if (document.body.classList.contains("UIPage_LoggedOut")) {
    return false;
  }
  return true;
}
