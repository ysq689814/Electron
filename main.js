const {app, BrowserWindow, ipcMain, Menu, MenuItem, globalShortcut} = require('electron')
const path = require('path')
const url = require('url')

/**
 * ipcMain 主进程
 */


// 全局共享
global.sharedObject = {
  newTel: '000'
}

let mainWindow = null //主窗口
let subWindow = null  //子窗口
let subWindow2 = null
let subWindow3 = null

const menu = new Menu()
menu.append(new MenuItem({
  label: 'Open DevTools',
  accelerator: 'F12',
  click: (menuItem, browserWindow, event) => { browserWindow.webContents.openDevTools() }
}))
Menu.setApplicationMenu(menu)

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    nodeIntegration: false,
    show: false,
    webPreferences: {
      nodeIntegrationInWorker: true, //多线程
      nativeWindowOpen: true        //window.open窗口
    },
    alwaysOnTop: false, // 应用是否始终在所有顶层之上
    frame: true,//是否显示窗口边框
    resizable: true,//可否缩放
    movable: true, //可否移动
  })

  mainWindow.loadURL('http://127.0.0.1:8080/index.html?' +Date.now())

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    mainWindow = null
  })

  mainWindow.once('ready-to-show', function () {
    mainWindow.show()

    //主进程发送消息给渲染进程
    mainWindow.webContents.send('main-process-messages', '窗口创建成功！')
  })

  // 打开窗口  3.0.0版本的支持 1系列不支持
  mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options, additionalFeatures) => {
    console.log(frameName)
    if (frameName === 'second' || frameName === 'second2' || frameName === 'third') {
      // open window as modal
      event.preventDefault()
      Object.assign(options, {
        modal: true,
        parent: mainWindow,
        width: 800,
        height: 600
      })
      if (frameName === 'second') {
        subWindow =  event.newGuest = new BrowserWindow(options)
        subWindow.on('new-window',  (event, url, frameName, disposition, options, additionalFeatures) => {
          console.log(frameName)
          subWindow3 =  event.newGuest = new BrowserWindow(options)
          subWindow3.on('closed', function () {
            subWindow3 = null
          })
        })
        subWindow.on('closed', function () {
          subWindow = null
        })
        subWindow.webContents.openDevTools()

      } else  if (frameName === 'second2') {
        subWindow2 =  event.newGuest = new BrowserWindow(options)
        subWindow2.on('closed', function () {
          subWindow2 = null
        })
        subWindow2.webContents.openDevTools()
      }
    }
  })

  mainWindow.webContents.openDevTools()
}

/**
 * app完成初始化时，执行窗体的创建。
 */
app.on('ready', () => {
  createWindow()
  let msg = {
    x: 10,
    y: 20,
    type: 'I'
  }
  setInterval(() => {
    msg.now = Date.now()
    if (mainWindow && mainWindow.webContents.send)
    mainWindow.webContents.send('new-messages', msg)
    if (subWindow && subWindow.webContents.send) {
      subWindow.webContents.send('new-messages', msg)
    }
    if (subWindow2 && subWindow2.webContents.send) {
      subWindow2.webContents.send('new-messages', msg)
    }
  }, 500)

  //调开web的开发者模式
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    let focusWin = BrowserWindow.getFocusedWindow()
    focusWin && focusWin.toggleDevTools()
  })

  //主进程与渲染进程的通信
  global.userName = "hello"

})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    mainWindow = null
    subWindow = null
    subWindow2 = null
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * 主进程接收子进程消息
 */
ipcMain.on('MainMsgFromRender', (event, arg) => {
  console.log('MainMsgFromRender主进程接收子进程消息：', arg)
  event.sender.send('RenderMsgFromMain', arg)
})


//主进程接收子进程消息
ipcMain.on('mainSendMessage', (event, msg) => {
  console.log('mainSendMessage主进程接收子进程消息：', msg)
  mainWindow.webContents.send('new-messages', msg)
  subWindow && subWindow.webContents.send('new-messages', msg)
  subWindow2 && subWindow2.webContents.send('new-messages', msg)
 // event.sender.send('new-messages', msg)
})

ipcMain.on('open-main-window', function (e, data) {
  console.log(e)
})
