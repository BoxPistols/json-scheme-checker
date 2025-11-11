const { contextBridge } = require('electron');

// セキュアなAPIをレンダラープロセスに公開
// 現在は基本実装のみ。将来的にIPC通信が必要になった場合はここに追加
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: process.versions.electron,
});

console.log('Preload script loaded');
