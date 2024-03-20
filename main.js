const { app, BrowserWindow, ipcMain, dialog, BrowserView } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');

Object.defineProperty(app, 'isPackaged', {
  get() {
    return true;
  }
});


async function handleFileOpen () {
  const { canceled, filePaths } = await dialog.showOpenDialog()
  if (!canceled) {
    return filePaths[0]
  }
}
var mainWindow;
function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800, 
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  mainWindow.webContents.openDevTools();
  mainWindow.loadFile('index.html')


  // const view = new BrowserView()
  // mainWindow.setBrowserView(view)
  // view.setBounds({ x: 0, y: 0, width: 300, height: 300 })
  // view.webContents.loadURL('https://electronjs.org')
}

app.whenReady().then(() => {
  ipcMain.handle('dialog:openFile', handleFileOpen)
  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})






// 定义返回给渲染层的相关提示文案
const message = {
  error: '检查更新出错',
  checking: '正在检查更新……',
  updateAva: '检测到新版本，正在下载……',
  updateNotAva: '现在使用的就是最新版本，不用更新',
};
// 这里是为了在本地做应用升级测试使用
if (isDev) {
  autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
}
// 主进程跟渲染进程通信
const sendUpdateMessage = (text) => {
  // 发送消息给渲染进程
  mainWindow.webContents.send('message', text);
};

// 设置自动下载为false，也就是说不开始自动下载
autoUpdater.autoDownload = false;
// 检测下载错误
autoUpdater.on('error', (error) => {
  sendUpdateMessage(`${message.error}:${error}`);
});
// 检测是否需要更新
autoUpdater.on('checking-for-update', () => {
  sendUpdateMessage(message.checking);
});
// 检测到可以更新时
autoUpdater.on('update-available', (e) => {
  // 这里我们可以做一个提示，让用户自己选择是否进行更新
  dialog.showMessageBox({
      type: 'info',
      title: '应用有新的更新',
      message: '发现新版本: ' + e.version + '，是否现在更新？',
      buttons: ['是', '否']
  }).then(({ response }) => {
      if (response === 0) {
          // 下载更新
          autoUpdater.downloadUpdate();
          sendUpdateMessage(message.updateAva);
      }
  });
  
  // 也可以默认直接更新，二选一即可
  // autoUpdater.downloadUpdate();
  // sendUpdateMessage(message.updateAva);
});
// 检测到不需要更新时
autoUpdater.on('update-not-available', () => {
  // 这里可以做静默处理，不给渲染进程发通知，或者通知渲染进程当前已是最新版本，不需要更新
  sendUpdateMessage(message.updateNotAva);
});
// 更新下载进度
autoUpdater.on('download-progress', (progress) => {
  // 直接把当前的下载进度发送给渲染进程即可，有渲染层自己选择如何做展示
  mainWindow.webContents.send('downloadProgress', progress);
});
// 当需要更新的内容下载完成后
autoUpdater.on('update-downloaded', () => {
  // 给用户一个提示，然后重启应用；或者直接重启也可以，只是这样会显得很突兀
  dialog.showMessageBox({
      title: '安装更新',
      message: '更新下载完毕，应用将重启并进行安装'
  }).then(() => {
      // 退出并安装应用
      setImmediate(() => autoUpdater.quitAndInstall());
  });
});
// 我们需要主动触发一次更新检查
ipcMain.on('checkForUpdate', () => {
  // 当我们收到渲染进程传来的消息，主进程就就进行一次更新检查
  autoUpdater.checkForUpdates();
});
// 当前引用的版本告知给渲染层
ipcMain.on('checkAppVersion', () => {
  mainWindow.webContents.send('version', app.getVersion());
});