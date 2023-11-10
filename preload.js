const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile')
})



const ipc = {
  render: {
    // 主进程发出的通知
    send: ['checkForUpdate', 'checkAppVersion'],
    // 渲染进程发出的通知
    receive: ['version', 'downloadProgress'],
  }
};
// 通过contextBridge将electron注入到渲染进程的window上面，我们只需要访问window.electron，即可访问到相关的内容
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer,
  ipcRender: {
      // 主进程发送通知给渲染进程
      send: (channel, data) => {
          const validChannels = ipc.render.send;
          if (validChannels.includes(channel)) {
              ipcRenderer.send(channel, data);
          }
      },
      // 渲染进程监听到主进程发来的通知，执行相关的操作
      receive: (channel, func) => {
          const validChannels = ipc.render.receive;
          if (validChannels.includes(channel)) {
              ipcRenderer.on(`${channel}`, (event, ...args) => func(...args));
          }
      }
  }
});
