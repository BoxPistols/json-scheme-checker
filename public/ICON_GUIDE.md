# アプリアイコン作成ガイド

このディレクトリには、デスクトップアプリのアイコンファイルを配置します。

## 必要なファイル

- `icon.icns` - macOS用（512x512px以上）
- `icon.ico` - Windows用（256x256px以上）
- `icon.png` - Linux用（512x512px）

## 作成方法

### オンラインツールを使用（推奨）

1. **icon.svg** を https://cloudconvert.com/ などのツールでPNGに変換（512x512px）
2. 生成されたPNGを以下のツールで各形式に変換：
   - ICNS: https://iconverticons.com/online/ または https://anyconv.com/png-to-icns-converter/
   - ICO: https://convertio.co/ja/png-ico/ または https://www.icoconverter.com/

### コマンドラインツールを使用

#### Macの場合（ICNS作成）

```bash
# icon.pngを512x512pxで用意
mkdir icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png

iconutil -c icns icon.iconset -o icon.icns
rm -rf icon.iconset
```

#### Windowsの場合（ICO作成）

ImageMagickを使用：

```bash
brew install imagemagick  # Macの場合
# または
sudo apt install imagemagick  # Linuxの場合

convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico
```

#### Node.jsツールを使用

```bash
npm install -g png2icons

# ICNS作成（Mac）
png2icons icon.png icon --icns

# ICO作成（Windows）
png2icons icon.png icon --ico
```

## アイコンがない場合

アイコンファイルがない場合、electron-builderはデフォルトのElectronアイコンを使用します。アプリは正常に動作しますが、独自のブランディングはありません。

## 推奨デザイン

- シンプルで認識しやすいデザイン
- 512x512pxの高解像度で作成
- 背景は透明またはブランドカラー
- 小さいサイズ（16x16px）でも識別可能
- macOSのガイドライン: 角丸、影なし、透明背景
- Windowsのガイドライン: 正方形、影つき、複数サイズ

## 参考リソース

- [Apple Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Microsoft Windows App Icon Guidelines](https://docs.microsoft.com/en-us/windows/apps/design/style/iconography/app-icon-design)
- [electron-builder Icon Configuration](https://www.electron.build/icons)
