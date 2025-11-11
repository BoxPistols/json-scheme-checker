const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

let mainWindow = null;
let expressApp = null;
let server = null;
const PORT = 3333;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    title: 'JSON-LD Schema Viewer',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 外部リンクはデフォルトのブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://localhost:${PORT}`)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Expressサーバーが起動するまで待機
  setTimeout(() => {
    mainWindow.loadURL(`http://localhost:${PORT}`);
  }, 1000);

  // 開発者ツール（必要に応じてコメントアウト）
  // mainWindow.webContents.openDevTools();
}

function startExpressServer() {
  try {
    expressApp = require('../server.js');

    server = expressApp.listen(PORT, '127.0.0.1', () => {
      console.log(`JSON-LD Proxy Server started on http://localhost:${PORT}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`ポート ${PORT} は既に使用されています。`);
        app.quit();
      } else {
        console.error('サーバーエラー:', error);
      }
    });
  } catch (error) {
    console.error('Expressサーバーの起動に失敗しました:', error);
    app.quit();
  }
}

app.whenReady().then(() => {
  startExpressServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (server) {
      server.close(() => {
        console.log('Expressサーバーを停止しました');
        app.quit();
      });
    } else {
      app.quit();
    }
  }
});

app.on('before-quit', () => {
  if (server) {
    server.close();
  }
});

process.on('uncaughtException', (error) => {
  console.error('予期しないエラー:', error);
});
