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

## 機能

### メニューバー

デスクトップアプリには、以下のメニューが含まれています：

#### ファイル

- **新しいウィンドウ** (Cmd/Ctrl+N): 新しいアプリウィンドウを開く
- **終了** (Cmd/Ctrl+Q): アプリを終了

#### 編集

- **元に戻す** (Cmd/Ctrl+Z)
- **やり直す** (Cmd/Ctrl+Shift+Z)
- **切り取り** (Cmd/Ctrl+X)
- **コピー** (Cmd/Ctrl+C)
- **貼り付け** (Cmd/Ctrl+V)
- **すべて選択** (Cmd/Ctrl+A)

#### 表示

- **ホームに戻る** (Cmd/Ctrl+H): トップページに戻る
- **再読み込み** (Cmd/Ctrl+R): ページをリロード
- **強制再読み込み** (Cmd/Ctrl+Shift+R): キャッシュをクリアしてリロード
- **開発者ツール** (Cmd+Alt+I / Ctrl+Shift+I): DevToolsを開く
- **実際のサイズ** (Cmd/Ctrl+0): ズームをリセット
- **拡大** (Cmd/Ctrl++): ズームイン
- **縮小** (Cmd/Ctrl+-): ズームアウト
- **フルスクリーン** (F11 / Ctrl+Cmd+F): フルスクリーンモード切り替え

#### ウィンドウ

- **最小化** (Cmd/Ctrl+M)
- **ズーム**: ウィンドウのズーム（Macのみ）
- **すべてを前面に**: すべてのウィンドウを前面に（Macのみ）

#### ヘルプ

- **ドキュメント**: オンラインドキュメントを開く
- **GitHub**: GitHubリポジトリを開く
- **バージョン情報**: アプリのバージョン情報を表示

### キーボードショートカット

主要なショートカットキー一覧：

| 操作                     | Mac               | Windows/Linux       |
| ------------------------ | ----------------- | ------------------- |
| 新しいウィンドウ         | Cmd+N             | Ctrl+N              |
| ホームに戻る             | Cmd+H             | Ctrl+H              |
| 再読み込み               | Cmd+R             | Ctrl+R              |
| 強制再読み込み           | Cmd+Shift+R       | Ctrl+Shift+R        |
| 開発者ツール             | Cmd+Alt+I         | Ctrl+Shift+I        |
| 拡大                     | Cmd++             | Ctrl++              |
| 縮小                     | Cmd+-             | Ctrl+-              |
| 実際のサイズ             | Cmd+0             | Ctrl+0              |
| フルスクリーン           | Ctrl+Cmd+F        | F11                 |
| 終了                     | Cmd+Q             | Ctrl+Q              |
| ウィンドウを閉じる       | Cmd+W             | Ctrl+W              |
| コピー                   | Cmd+C             | Ctrl+C              |
| 貼り付け                 | Cmd+V             | Ctrl+V              |
| すべて選択               | Cmd+A             | Ctrl+A              |

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

### アイコンの作成方法

1. **icon.svg** - ベクターデザインファイル（プロジェクトに含まれています）
2. SVGをPNG（512x512px）に変換
3. PNGを各プラットフォーム形式（ICNS、ICO）に変換

詳細な手順と推奨ツールは [`public/ICON_GUIDE.md`](./public/ICON_GUIDE.md) を参照してください。

### デフォルトアイコン

アイコンファイルがない場合は、デフォルトのElectronアイコンが使用されます。アプリは正常に動作しますが、独自のブランディングはありません。

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
2. **メニューバー**: アプリケーションメニュー（ファイル、編集、表示、ウィンドウ、ヘルプ）とショートカットキーを実装
3. **ウィンドウ表示**: BrowserWindowでlocalhostにアクセスし、Webアプリを表示
4. **外部リンク**: 外部リンクはデフォルトのブラウザで開く
5. **セキュリティ**: contextIsolation有効、nodeIntegration無効、webSecurity有効
6. **終了時**: アプリ終了時にExpressサーバーも自動的に停止

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
