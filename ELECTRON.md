# JSON-LD Schema Viewer - デスクトップアプリ版

このドキュメントでは、JSON-LD Schema ViewerをMac/Windowsのデスクトップアプリケーションとして使用する方法を説明します。

## 概要

Electronを使用してWebアプリケーションをデスクトップアプリ化しました。アプリ内でExpressサーバーが自動的に起動し、ネイティブアプリケーションとしてシームレスに動作します。

## 開発モードで起動

開発中にアプリを起動する場合：

```bash
pnpm electron:dev
```

このコマンドでElectronアプリが起動し、内部でExpressサーバーが起動して`http://localhost:3333`にアクセスします。

## アプリのビルド

### すべてのプラットフォーム（Mac + Windows）

```bash
pnpm electron:build
```

このコマンドでMacとWindows向けのインストーラーが生成されます。

### Mac専用ビルド

```bash
pnpm electron:build:mac
```

生成されるファイル：
- `dist/JSON-LD Schema Viewer-1.0.0.dmg` - macOS向けDMGインストーラー
- `dist/JSON-LD Schema Viewer-1.0.0-mac.zip` - macOS向けZIPファイル

### Windows専用ビルド

```bash
pnpm electron:build:win
```

生成されるファイル：
- `dist/JSON-LD Schema Viewer Setup 1.0.0.exe` - Windows向けNSISインストーラー
- `dist/JSON-LD Schema Viewer 1.0.0.exe` - Windows向けポータブル実行ファイル

## ビルド要件

### Macでビルドする場合

Mac向けのビルドはMacマシンで実行する必要があります。

```bash
# Xcodeコマンドラインツールのインストール（初回のみ）
xcode-select --install
```

### Windowsでビルドする場合

Windows向けのビルドはWindowsマシンで実行する必要があります。または、MacでWineを使用してWindowsビルドを行うことも可能です。

```bash
# Mac上でWindowsビルドを行う場合（オプション）
brew install wine-stable
```

### クロスプラットフォームビルド

CI/CD環境でビルドする場合、以下のサービスを利用できます：
- GitHub Actions
- CircleCI
- Travis CI

## アイコンについて

アプリアイコンは`public/`ディレクトリに配置します：

- **Mac**: `public/icon.icns` - 512x512px以上のICNSファイル
- **Windows**: `public/icon.ico` - 256x256px以上のICOファイル
- **Linux**: `public/icon.png` - 512x512pxのPNGファイル

アイコンが存在しない場合は、デフォルトのElectronアイコンが使用されます。

## アプリの構造

```
json-ld-viewer/
├── electron/
│   ├── main.js        # Electronメインプロセス
│   └── preload.js     # プリロードスクリプト
├── server.js          # Expressサーバー
├── public/            # フロントエンド
├── api/               # APIエンドポイント
└── dist/              # ビルド出力（.gitignoreで除外）
```

## 動作仕様

1. **サーバー起動**: アプリ起動時に内部でExpressサーバーが`http://localhost:3333`で起動
2. **ウィンドウ表示**: BrowserWindowでlocalhostにアクセスし、Webアプリを表示
3. **外部リンク**: 外部リンクはデフォルトのブラウザで開く
4. **終了時**: アプリ終了時にExpressサーバーも自動的に停止

## トラブルシューティング

### ポート3333が使用中

アプリが起動しない場合、ポート3333が他のプロセスで使用されている可能性があります。

```bash
# ポート使用状況を確認
lsof -i :3333

# 使用中のプロセスを停止
kill $(lsof -t -i:3333)
```

### ビルドエラー

ビルド時にエラーが発生する場合：

1. 依存関係を再インストール：
   ```bash
   rm -rf node_modules
   pnpm install
   ```

2. キャッシュをクリア：
   ```bash
   rm -rf dist
   rm -rf ~/.electron
   ```

3. 再度ビルド：
   ```bash
   pnpm electron:build:mac  # または :win
   ```

### 開発者ツールを表示

開発中にブラウザの開発者ツールを表示したい場合、`electron/main.js`の以下の行のコメントを外します：

```javascript
// mainWindow.webContents.openDevTools();
```

## セキュリティ

このアプリは以下のセキュリティ設定を採用しています：

- **contextIsolation**: 有効 - レンダラープロセスとNode.jsプロセスを分離
- **nodeIntegration**: 無効 - レンダラープロセスでのNode.js APIアクセスを制限
- **webSecurity**: 有効 - 同一オリジンポリシーを適用
- **preload**: セキュアなAPIのみを公開

## 関連ドキュメント

- [CLAUDE.md](./CLAUDE.md) - プロジェクト全体の概要とコマンド
- [README.md](./README.md) - Webアプリケーションとしての使用方法
- [Electron公式ドキュメント](https://www.electronjs.org/docs/latest/)
- [electron-builder公式ドキュメント](https://www.electron.build/)

## ライセンス

このプロジェクトのライセンスについては、READMEまたはLICENSEファイルを参照してください。
