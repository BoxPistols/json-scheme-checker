const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

let mainWindow = null;
let expressApp = null;
let server = null;
const PORT = 3333;

function createMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    // Macの場合はアプリメニュー
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about', label: 'JSON-LD Schema Viewerについて' },
              { type: 'separator' },
              { role: 'services', label: 'サービス' },
              { type: 'separator' },
              { role: 'hide', label: 'JSON-LD Schema Viewerを隠す' },
              { role: 'hideOthers', label: '他を隠す' },
              { role: 'unhide', label: 'すべて表示' },
              { type: 'separator' },
              { role: 'quit', label: 'JSON-LD Schema Viewerを終了' },
            ],
          },
        ]
      : []),

    // ファイルメニュー
    {
      label: 'ファイル',
      submenu: [
        {
          label: '新しいウィンドウ',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            createWindow();
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close', label: 'ウィンドウを閉じる' } : { role: 'quit', label: '終了' },
      ],
    },

    // 編集メニュー
    {
      label: '編集',
      submenu: [
        { role: 'undo', label: '元に戻す' },
        { role: 'redo', label: 'やり直す' },
        { type: 'separator' },
        { role: 'cut', label: '切り取り' },
        { role: 'copy', label: 'コピー' },
        { role: 'paste', label: '貼り付け' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle', label: 'ペーストしてスタイルを合わせる' },
              { role: 'delete', label: '削除' },
              { role: 'selectAll', label: 'すべて選択' },
            ]
          : [{ role: 'delete', label: '削除' }, { type: 'separator' }, { role: 'selectAll', label: 'すべて選択' }]),
      ],
    },

    // 表示メニュー
    {
      label: '表示',
      submenu: [
        {
          label: 'ホームに戻る',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`http://localhost:${PORT}`);
            }
          },
        },
        {
          label: '再読み込み',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) {
              mainWindow.reload();
            }
          },
        },
        {
          label: '強制再読み込み',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.reloadIgnoringCache();
            }
          },
        },
        { type: 'separator' },
        {
          label: '開発者ツール',
          accelerator: isMac ? 'Cmd+Alt+I' : 'Ctrl+Shift+I',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          },
        },
        { type: 'separator' },
        { role: 'resetZoom', label: '実際のサイズ' },
        { role: 'zoomIn', label: '拡大' },
        { role: 'zoomOut', label: '縮小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'フルスクリーン' },
      ],
    },

    // ウィンドウメニュー
    {
      label: 'ウィンドウ',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'zoom', label: 'ズーム' },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front', label: 'すべてを前面に' }, { type: 'separator' }, { role: 'window', label: 'ウィンドウ' }]
          : [{ role: 'close', label: '閉じる' }]),
      ],
    },

    // ヘルプメニュー
    {
      role: 'help',
      label: 'ヘルプ',
      submenu: [
        {
          label: 'ドキュメント',
          click: async () => {
            await shell.openExternal('https://json-ld-view.vercel.app/');
          },
        },
        {
          label: 'GitHub',
          click: async () => {
            await shell.openExternal('https://github.com/BoxPistols/json-scheme-checker');
          },
        },
        { type: 'separator' },
        {
          label: 'バージョン情報',
          click: () => {
            const version = app.getVersion();
            const electronVersion = process.versions.electron;
            const chromeVersion = process.versions.chrome;
            const nodeVersion = process.versions.node;

            const message = `JSON-LD Schema Viewer v${version}\n\nElectron: ${electronVersion}\nChrome: ${chromeVersion}\nNode.js: ${nodeVersion}`;

            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'バージョン情報',
              message: 'JSON-LD Schema Viewer',
              detail: message,
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

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
  createMenu();
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
