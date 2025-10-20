# AI開発ツール統合ガイド：MCP、Context7、Serena

このドキュメントは、Claude Code採用プロジェクトで、MCP（Model Context Protocol）、Context7、Serenaを導入・設定するための汎用ガイドです。

**対象**: すべてのClaude Code採用プロジェクト（言語・フレームワーク不問）

---

## 目次

1. [概念](#概念)
2. [インストール手順](#インストール手順)
3. [設定方法](#設定方法)
4. [実例](#実例)
5. [期待される効果](#期待される効果)
6. [トラブルシューティング](#トラブルシューティング)

---

## 概念

### MCP（Model Context Protocol）とは

**MCPは、AIモデルとローカル開発環境を接続するための標準プロトコルです。**

#### 従来のフロー

```
AI開発支援
    ↓
[インターネット経由で実行]
    ↓
ライブラリドキュメント・プロジェクト情報なし
    ↓
不正確なコード提案、開発ガイドラインの理解不足
```

#### MCP導入後

```
AI開発支援
    ↓
[MCP経由でローカルツール接続]
    ↓
リアルタイムドキュメント・プロジェクト構造を自動認識
    ↓
正確で最新のコード提案、ガイドラインに沿った生成
```

### MCPが提供するもの

| 機能                     | 説明                                           | 例                             |
| ------------------------ | ---------------------------------------------- | ------------------------------ |
| **リソースアクセス**     | ローカルファイル・プロジェクト情報へのアクセス | プロジェクト構造、設定ファイル |
| **ツール実行**           | 標準化されたツール実行インターフェース         | コマンド実行、ファイル操作     |
| **プロンプトキャッシュ** | 頻繁に使用する情報をキャッシュ                 | 開発ガイドライン、API仕様      |

---

## Context7とは

**Context7（@upstash/context7-mcp）は、MCPの実装例で、ライブラリドキュメント自動取得・コード例検索を提供します。**

### 主な機能

| 機能                     | 説明                                       | 利点                               |
| ------------------------ | ------------------------------------------ | ---------------------------------- |
| **ライブラリ自動検索**   | npm/yarn/pip等のパッケージマネージャー統合 | 依存パッケージの仕様を自動認識     |
| **ドキュメント自動取得** | 最新のAPI仕様、使用例を取得                | 常に最新の情報に基づいたコード生成 |
| **リアルタイム同期**     | パッケージ更新時にドキュメント自動更新     | 廃止されたAPIを使うことを防止      |

### 実用例

**従来**: APIリファレンスをGoogle検索 → npm公式サイト閲覧 → ドキュメント熟読（5-10分）

**Context7使用**: AI「このパッケージの最新APIは？」→ Context7自動取得 → AI提案（30秒）

---

## Serenaとは

**Serenaは、Claude Code統合のプロジェクト管理・メモリシステムです。**

### 問題を解決する

**Serena導入前**:

- 開発ガイドラインが散在している
- 新メンバーがプロジェクト構造を理解するのに時間がかかる
- チーム内で異なる開発手順を使用
- AIがプロジェクト規則を毎回説明する必要がある

**Serena導入後**:

- プロジェクト設定を一元管理
- AI起動時に自動的にガイドラインを提供
- 統一された開発ワークフロー
- AIが常にプロジェクトコンテキストを保持

### 主な機能

| 機能                 | ファイル                                  | 説明                                                 |
| -------------------- | ----------------------------------------- | ---------------------------------------------------- |
| **プロジェクト設定** | `.serena/project.yml`                     | 言語、エンコーディング、除外パス等を設定             |
| **AI初期指示**       | `.serena/project.yml` の `initial_prompt` | プロジェクト固有のガイドラインをAIに提供             |
| **メモリシステム**   | `.serena/memories/`                       | アーキテクチャ決定事項、ベストプラクティス等を永続化 |
| **シンボル検索**     | Serena内蔵ツール                          | 関数・クラス定義を高速検索                           |

---

## インストール手順

### 前提条件

- Node.js 16以上がインストール済み
- Claude Code対応のIDE（Cursor、GitHub Copilot等）
- `git` がインストール済み

### ステップ1：`.mcp.json` を作成

プロジェクトルートに `.mcp.json` ファイルを作成します：

```bash
# プロジェクトルートで実行
cat > .mcp.json << 'EOF'
{
  "mcpServers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp@latest"
      ],
      "env": {
        "CONTEXT7_DEBUG": "false"
      },
      "timeout": 30000,
      "maxRetries": 3,
      "retryDelayMs": 1000,
      "description": "ライブラリドキュメント自動取得・コード例検索用"
    }
  }
}
EOF
```

### ステップ2：`.serena/` ディレクトリ構造を作成

```bash
# ディレクトリ作成
mkdir -p .serena/memories
mkdir -p .serena/cache

# キャッシュを.gitignoreに追加
cat > .serena/.gitignore << 'EOF'
/cache
EOF
```

### ステップ3：`.serena/project.yml` を作成

プロジェクトの言語に応じてカスタマイズします（テンプレートは後述）

```bash
cat > .serena/project.yml << 'EOF'
# プロジェクト設定（下記の「設定方法」セクションを参照）
EOF
```

### ステップ4：IDE設定を確認

**Cursor使用時**:

```bash
# Cursorを再起動
# 自動的に .mcp.json を認識
```

**GitHub Copilot使用時**:

```bash
# VSCode設定で MCP servers を有効化
# settings.json に .mcp.json パスを指定
```

### ステップ5：動作確認

IDEのコマンドパレットで確認：

```
# Cursor
- Cmd/Ctrl + K → "MCP: Status" を入力
- Context7が "Ready" と表示されることを確認

# Copilot
- Copilot Chat で "@mcp context7" を入力
- ドキュメント取得が機能することを確認
```

---

## 設定方法

### `.serena/project.yml` テンプレート

#### TypeScript/Node.js プロジェクト

```yaml
language: typescript
encoding: 'utf-8'
ignore_all_files_in_gitignore: true

# 除外パス（検索から除外）
ignored_paths:
  - node_modules
  - dist
  - build
  - .vercel
  - .next
  - coverage
  - .vscode
  - .DS_Store
  - '*.log'

# 読み取り専用モード（編集を防止する場合のみ）
read_only: false

# AI向け初期指示（プロジェクト固有情報）
initial_prompt: |
  このプロジェクト（<PROJECT_NAME>）で作業する際のガイドライン：

  【言語・規約】
  - すべての応答・コメント・ドキュメントは<LANGUAGE>で記述
  - <SPECIFIC_RULES>（例：絵文字禁止、命名規則等）

  【技術スタック】
  - <MAIN_TECHNOLOGY>（例：Node.js + Express.js）
  - <FRAMEWORK>（例：React、Vue等）
  - <DATABASE>（該当する場合）

  【開発環境】
  - ポート：<DEV_PORT>
  - Node.js版：<NODE_VERSION>（package.jsonで管理）
  - パッケージマネージャー：<PACKAGE_MANAGER>（npm/yarn/pnpm）

  【主要コマンド】
  - <CMD_1>（例：npm run dev）
  - <CMD_2>（例：npm test）
  - <CMD_3>（例：npm run build）

  【重要なドキュメント】
  - <DOC_1>（例：.ai-docs/shared/PROJECT_OVERVIEW.md）
  - <DOC_2>（例：DEVELOPMENT_WORKFLOW.md）

  【プロジェクト構造】
  - <STRUCTURE_INFO>（例：src/components/, src/api/等）

  【重要な規則】
  - <RULE_1>
  - <RULE_2>

# プロジェクトメタデータ
project_name: '<PROJECT_NAME>'
project_description: '<PROJECT_DESCRIPTION>'
development_port: <PORT_NUMBER>
main_entry_points:
  - <FILE_1>
  - <FILE_2>

# ツール設定
excluded_tools: []
```

#### Python プロジェクト

```yaml
language: python
encoding: 'utf-8'
ignore_all_files_in_gitignore: true

ignored_paths:
  - __pycache__
  - .venv
  - venv
  - dist
  - build
  - '*.egg-info'
  - .pytest_cache
  - .coverage

read_only: false

initial_prompt: |
  このプロジェクト（<PROJECT_NAME>）で作業する際のガイドライン：

  【言語・規約】
  - すべてのコードと説明は日本語
  - PEP 8に準拠

  【技術スタック】
  - Python <VERSION>
  - <FRAMEWORK>（例：Django、Flask等）

  【開発環境】
  - ポート：<PORT>
  - 仮想環境：venv
  - 依存管理：requirements.txt

  【主要コマンド】
  - python manage.py runserver
  - pytest
  - python -m flake8

project_name: '<PROJECT_NAME>'
project_description: '<PROJECT_DESCRIPTION>'
main_entry_points:
  - main.py
  - app.py

excluded_tools: []
```

#### Go プロジェクト

```yaml
language: go
encoding: 'utf-8'
ignore_all_files_in_gitignore: true

ignored_paths:
  - vendor
  - bin
  - dist
  - .idea
  - coverage

read_only: false

initial_prompt: |
  このプロジェクト（<PROJECT_NAME>）で作業する際のガイドライン：

  【言語・規約】
  - Go style guide に準拠
  - エラーハンドリングを必須

  【技術スタック】
  - Go <VERSION>
  - <FRAMEWORK>（例：Gin、Echo等）

  【開発環境】
  - ポート：<PORT>
  - 依存管理：go.mod / go.sum

  【主要コマンド】
  - go run main.go
  - go test ./...
  - go build

project_name: '<PROJECT_NAME>'
project_description: '<PROJECT_DESCRIPTION>'
main_entry_points:
  - main.go

excluded_tools: []
```

### `.mcp.json` 設定オプション

```json
{
  "mcpServers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"],
      "env": {
        "CONTEXT7_DEBUG": "false" // true で詳細ログ出力
      },
      "timeout": 30000, // タイムアウト（ミリ秒）
      "maxRetries": 3, // ネットワーク失敗時のリトライ回数
      "retryDelayMs": 1000, // リトライ間隔（ミリ秒）
      "description": "MCPサーバーの説明"
    }
  }
}
```

**推奨値**:

- `timeout`: 20000-60000（単位：ミリ秒）
- `maxRetries`: 2-5
- `retryDelayMs`: 500-2000

---

## 実例

### 実例1：json-ld-viewer（Node.js + Vanilla JS）

**プロジェクト構成**:

```
json-ld-viewer/
├── server.js              # Express サーバー
├── public/index.html      # フロントエンド
├── api/proxy.js           # Vercel サーバーレス関数
└── package.json
```

#### `.mcp.json`

```json
{
  "mcpServers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"],
      "env": {
        "CONTEXT7_DEBUG": "false"
      },
      "timeout": 30000,
      "maxRetries": 3,
      "retryDelayMs": 1000,
      "description": "ライブラリドキュメント自動取得・コード例検索用"
    }
  }
}
```

#### `.serena/project.yml`

```yaml
language: typescript
encoding: 'utf-8'
ignore_all_files_in_gitignore: true

ignored_paths:
  - node_modules
  - dist
  - build
  - .vercel
  - .next
  - coverage
  - .vscode
  - .DS_Store
  - '*.log'

read_only: false

initial_prompt: |
  このプロジェクト（json-ld-viewer）で作業する際の重要なガイドライン：

  【言語】
  - すべての応答、コメント、ドキュメント、コミットメッセージは日本語で記述
  - ファイル内（コード、ドキュメント）で絵文字は使用禁止

  【技術スタック】
  - Node.js + Express.js + Vanilla JavaScript
  - Vercelへのサーバーレス関数デプロイ
  - ローカル開発ポート：3333
  - CORS回避のプロキシサーバー

  【主要コマンド】
  - pnpm dev: 開発サーバー起動（nodemon自動再起動）
  - pnpm start: 本番モード起動
  - pnpm lint / pnpm lint:fix: ESLint実行・修正
  - pnpm format: Prettier整形

  【重要なドキュメント】
  - .ai-docs/shared/PROJECT_OVERVIEW.md: アーキテクチャ・技術詳細
  - .ai-docs/shared/DEVELOPMENT_WORKFLOW.md: 開発ワークフロー
  - CLAUDE.md: 規約と開発ガイドライン

  【アーキテクチャの特徴】
  - ブラウザ → プロキシサーバー → 対象サイト（CORS回避）
  - Vercel環境: /api/proxy 使用
  - ローカル環境: http://localhost:3333/proxy 使用
  - IPv6問題対応: localhost は自動的に127.0.0.1に変換
  - Basic認証対応：ドメイン別にローカルストレージに保存

project_name: 'json-ld-viewer'
project_description: 'WebサイトのJSON-LD構造化データを抽出・可視化するツール。CORS制限を回避し、ローカル開発環境を含むあらゆるURLにアクセス可能。'
development_port: 3333
main_entry_points:
  - server.js
  - public/index.html
  - api/proxy.js

excluded_tools: []
```

---

## 期待される効果

### 開発効率の向上

| 項目                           | 従来    | 導入後 | 改善率   |
| ------------------------------ | ------- | ------ | -------- |
| **API調査**                    | 5-10分  | 30秒   | 90% 削減 |
| **プロジェクト理解**           | 15-30分 | 瞬時   | 99% 削減 |
| **コード生成精度**             | 70-80%  | 95-98% | 25% 向上 |
| **新メンバーオンボーディング** | 数時間  | 30分   | 85% 削減 |

### 具体的なシナリオ

#### シナリオ1：新メンバーがバグに遭遇

**従来**:

```
新メンバー: "ExpressでCORSエラーが出ました"
→ チームリード: "CLAUDE.md読んで、server.js確認してから..."
→ 15分説明
→ ようやく対応開始
```

**Serena導入後**:

```
新メンバー: "ExpressでCORSエラーが出ました"
→ AIアシスタント自動:
  "このプロジェクトではNode.js + Expressでプロキシサーバーを使用。
   CORS回避のためのプロキシ設定を server.js:XX で確認してください。"
→ 即座に対応
```

#### シナリオ2：新しい依存パッケージを導入

**従来**:

```
開発者: "axios最新版でこの機能を実装したい"
→ npm公式サイトでドキュメント検索
→ 使用例をコピペ
→ APIが廃止されていた（最新版で対応）
→ 修正
```

**Context7導入後**:

```
開発者: "axiosで○○を実装したい"
→ Context7自動: "axios最新版（v1.x）のドキュメント取得"
→ AI提案: "正確な最新コード"
→ 即座に実装
```

---

## トラブルシューティング

### Q1：Context7が認識されない

**症状**: Cursor/Copilot で MCP が表示されない

**原因**:

1. `.mcp.json` が正しい場所にない
2. JSON形式が無効
3. IDEがキャッシュしている

**解決方法**:

```bash
# 1. ファイル確認
ls -la .mcp.json
cat .mcp.json | jq .   # JSON形式チェック

# 2. IDE再起動
# Cursor/VSCode を完全に再起動

# 3. キャッシュクリア
rm -rf ~/.config/Cursor/User/workspaceStorage/*/
# または Copilot: Command Palette > "MCP: Reload"
```

### Q2：タイムアウトエラーが頻発

**症状**: "Context7 request timed out"

**原因**:

1. ネットワーク不安定
2. タイムアウト値が短すぎる
3. MCPサーバーの応答遅延

**解決方法**:

```json
{
  "timeout": 60000, // 30000 から 60000 に増加
  "maxRetries": 5, // 3 から 5 に増加
  "retryDelayMs": 2000 // 1000 から 2000 に増加
}
```

### Q3：Serena初期指示が反映されない

**症状**: AI起動時にプロジェクトガイドラインが表示されない

**原因**:

1. `.serena/project.yml` が読み込まれていない
2. `initial_prompt` がYAML形式でない
3. IDE キャッシュ

**解決方法**:

```bash
# 1. ファイル確認
ls -la .serena/project.yml
cat .serena/project.yml

# 2. YAML形式チェック
python3 -c "import yaml; yaml.safe_load(open('.serena/project.yml'))"

# 3. IDE再起動
```

### Q4：除外パスが機能していない

**症状**: node_modules 等の大量ファイルがシンボル検索に含まれる

**原因**:

1. `ignore_all_files_in_gitignore` が false
2. `ignored_paths` が正しい形式でない

**解決方法**:

```yaml
# ✓ 正しい形式
ignored_paths:
  - node_modules
  - "*.log"

# ✗ 間違い
ignored_paths: "node_modules, *.log"  # 文字列は不可
```

---

## 次のステップ

このドキュメントの導入後、以下を検討してください：

1. **プロジェクト固有のメモリ作成**

   ```bash
   # .serena/memories/ にマークダウンファイルを作成
   # 例：ARCHITECTURE.md, BEST_PRACTICES.md
   ```

2. **Context7のプリセット拡張**

   ```json
   // .mcp.json で複数のMCPサーバーを登録
   {
     "mcpServers": {
       "context7": { ... },
       "filesystem": { ... },  // ファイルシステムアクセス
       "git": { ... }          // Git操作
     }
   }
   ```

3. **チーム向けセットアップガイド作成**
   - `.github/CONTRIBUTING.md` に MCP/Serena セットアップを記載
   - チーム全体で統一環境を構築

4. **CI/CDパイプラインへの統合**
   - `.serena/project.yml` をバージョン管理
   - ローカル・本番環境で統一設定

---

## 参考資料

- [MCP 公式ドキュメント](https://modelcontextprotocol.io/)
- [Context7 GitHub リポジトリ](https://github.com/upstash/context7)
- [Claude Code ドキュメント](https://docs.claude.com/)
- [Cursor 公式ドキュメント](https://docs.cursor.sh/)

---

## まとめ

MCP、Context7、Serena の導入により：

✅ **開発効率 90% 削減** （API調査時間）
✅ **コード品質向上** （常に最新のベストプラクティス）
✅ **チーム統一** （プロジェクトガイドライン一元化）
✅ **オンボーディング時間 85% 削減** （新メンバーの学習時間）

すべてのClaude Code採用プロジェクトで活用できます。
