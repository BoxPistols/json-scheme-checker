# AI Documentation for JSON-LD Schema Viewer

## ドキュメント戦略について

このプロジェクトは **Single Source of Truth (SSOT)** の原則に基づき、複数のAIエディタ/ツールに対応した包括的なドキュメント構造を採用しています。

## ディレクトリ構造

```bash
.ai-docs/
├── README.md                  # このファイル（ドキュメント索引）
├── shared/                    # 共通ドキュメント（Single Source of Truth）
│   ├── PROJECT_OVERVIEW.md   # プロジェクト全体像・アーキテクチャ
│   └── DEVELOPMENT_WORKFLOW.md  # 開発コマンド・ワークフロー
├── cursor/                    # Cursor専用設定
│   └── → /.cursorrules       # ルートにあるCursorルール
├── copilot/                   # GitHub Copilot専用設定
│   └── → /.github/copilot-instructions.md
└── claude/                    # Claude Code専用設定
    └── → /CLAUDE.md          # ルートにあるClaude設定
```

## 各AIツール向けドキュメント

### すべてのAIツール共通

まず以下を読んでください：

- **[PROJECT_OVERVIEW.md](./shared/PROJECT_OVERVIEW.md)** - プロジェクトの全体像、技術スタック、アーキテクチャ
- **[DEVELOPMENT_WORKFLOW.md](./shared/DEVELOPMENT_WORKFLOW.md)** - 開発コマンド、ワークフロー、トラブルシューティング
- **[CLAUDE_CODE_CONCEPTS_GUIDE.md](./shared/CLAUDE_CODE_CONCEPTS_GUIDE.md)** - Claude Code の全機能解説と比較ガイド

### Claude Code

- **[/CLAUDE.md](../CLAUDE.md)** - Claude Code専用のクイックリファレンス
- 自動的に読み込まれる設定ファイル
- 共通ドキュメントへのリンクを含む

### Cursor AI

- **[/.cursorrules](../.cursorrules)** - Cursor専用ルール
- コードスタイル、パターン、チェックリスト
- Cursorエディタで自動認識

### GitHub Copilot

- **[/.github/copilot-instructions.md](../.github/copilot-instructions.md)** - Copilot専用ガイド
- コーディングパターン、ベストプラクティス
- Copilot Chatで参照可能

## ドキュメントの使い方

### 1. 初めてプロジェクトを触る場合

```bash
1. shared/PROJECT_OVERVIEW.md を読む
   ↓ プロジェクト全体を理解
2. shared/DEVELOPMENT_WORKFLOW.md を読む
   ↓ 開発方法を理解
3. 使用するAIツールの設定を確認
   - Claude Code → CLAUDE.md
   - Cursor → .cursorrules
   - Copilot → .github/copilot-instructions.md
```

### 2. 特定の情報を探す場合

| 知りたいこと           | 参照先                                                    |
| ---------------------- | --------------------------------------------------------- |
| プロジェクト概要       | `shared/PROJECT_OVERVIEW.md`                              |
| 技術スタック           | `shared/PROJECT_OVERVIEW.md` → 技術スタック               |
| 開発コマンド           | `shared/DEVELOPMENT_WORKFLOW.md` → コマンドリファレンス   |
| アーキテクチャ         | `shared/PROJECT_OVERVIEW.md` → アーキテクチャパターン     |
| デバッグ方法           | `shared/DEVELOPMENT_WORKFLOW.md` → デバッグ方法           |
| デプロイ手順           | `shared/DEVELOPMENT_WORKFLOW.md` → デプロイメント         |
| トラブルシューティング | `shared/DEVELOPMENT_WORKFLOW.md` → トラブルシューティング |
| Claude Code 機能の説明 | `shared/CLAUDE_CODE_CONCEPTS_GUIDE.md`                    |
| MCP・Context7 導入方法 | `shared/AI_DEVELOPMENT_TOOLS_SETUP.md`                    |
| コーディング規約       | 各AIツールの設定ファイル                                  |

### 3. ドキュメントを更新する場合

#### Single Source of Truth (共通情報)

→ `shared/` ディレクトリ内のファイルを更新

**更新すべき情報**:

- プロジェクトアーキテクチャの変更
- 新しい技術スタックの追加
- 開発ワークフローの変更
- 新しいコマンドの追加

#### AIツール固有の情報

→ 各AIツールの設定ファイルを直接更新

**更新すべき情報**:

- コーディングスタイルの変更
- AIツール固有のヒント
- プロンプトのベストプラクティス

## ドキュメントの原則

### 1. DRY (Don't Repeat Yourself)

- 共通情報は `shared/` に一度だけ記載
- 各AIツール設定からは `shared/` を参照
- 重複を避けてメンテナンス性を向上

### 2. 階層的な情報構成

```bash
Level 1: shared/ (詳細・網羅的)
  ↓
Level 2: AIツール設定 (要約・クイックリファレンス)
  ↓
Level 3: コード内コメント (具体的実装)
```

### 3. 更新の容易性

- 一箇所の更新で全AIツールに反映
- バージョン情報を各ファイルに記載
- 変更履歴は Git で管理

## メンテナンスガイドライン

### 更新タイミング

以下の場合は必ずドキュメントを更新：

- [ ] 新機能追加
- [ ] アーキテクチャの変更
- [ ] 開発ワークフローの変更
- [ ] デプロイ方法の変更
- [ ] 重要なバグ修正（トラブルシューティングに追加）

### 更新手順

1. `shared/` の該当ファイルを更新
2. 各AIツール設定で参照が正しいか確認
3. バージョン情報（Last Updated）を更新
4. コミットメッセージに `docs:` プレフィックスを付与

### 品質チェック

- [ ] 情報の重複がないか
- [ ] リンク切れがないか
- [ ] コードサンプルが動作するか
- [ ] 全AIツールで整合性が取れているか

## フィードバック

ドキュメントの改善提案は Issue または Pull Request で歓迎します。

**改善ポイント**:

- 不明確な説明
- 不足している情報
- 誤った情報
- 追加してほしいセクション

## バージョン情報

- **作成日**: 2025-10-12
- **最終更新**: 2025-10-12
- **対応AIツール**:
  - Claude Code (Sonnet 4.5)
  - Cursor AI (0.40+)
  - GitHub Copilot (Chat対応版)

---

**注意**: このディレクトリ（`.ai-docs/`）は開発者とAIツール向けのドキュメントです。
エンドユーザー向けのドキュメントは `/README.md` を参照してください。
