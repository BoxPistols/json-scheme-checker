# AI自動レビュー・改善システム セットアップガイド

このリポジトリには、Claude Code、Gemini、GitHub Copilotによる自動コードレビューと改善機能が設定されています。

## 重要: 言語設定

**すべてのAIツール（Claude、Gemini、GitHub Copilot）は日本語で応答してください。**

- コードレビュー: 日本語
- 改善提案: 日本語
- エラーメッセージ: 日本語
- ドキュメント: 日本語
- コメント: 日本語

英語での応答は禁止します。

---

## 概要

3つのAIツールが協力して、コードの品質向上をサポートします：

- **Claude Code**: 包括的なコードレビューと自動改善提案
- **Gemini**: セキュリティとパフォーマンスに焦点を当てたレビュー
- **GitHub Copilot**: エディタ内でのリアルタイムコード支援とレビュー

## セットアップ手順

### 1. 必要なシークレットの設定

GitHubリポジトリの Settings > Secrets and variables > Actions に以下を追加してください：

#### ANTHROPIC_API_KEY (Claude Code用)

1. [Anthropic Console](https://console.anthropic.com/) にアクセス
2. API Keysセクションで新しいAPIキーを作成
3. GitHubシークレットに `ANTHROPIC_API_KEY` として追加

#### GEMINI_API_KEY (Gemini用)

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. 新しいAPIキーを作成
3. GitHubシークレットに `GEMINI_API_KEY` として追加

#### GITHUB_TOKEN

- 自動的に利用可能（追加設定不要）

### 2. GitHub Actions権限の設定

1. リポジトリ Settings > Actions > General に移動
2. "Workflow permissions" セクションで以下を選択：
   - "Read and write permissions" を有効化
   - "Allow GitHub Actions to create and approve pull requests" にチェック

### 3. GitHub Copilotの有効化

1. GitHubアカウントで [GitHub Copilot](https://github.com/features/copilot) を有効化
2. 使用しているエディタ（VS Code、JetBrainsなど）にCopilot拡張機能をインストール
3. `.github/copilot-instructions.md` が自動的に読み込まれ、プロジェクト固有の指示が適用されます

## 使用方法

### 自動レビュー（PR作成時）

Pull Requestを作成すると、自動的に以下が実行されます：

1. **Claude Code レビュー** (約2-3分)
   - 包括的なコード品質チェック
   - セキュリティ分析
   - パフォーマンス評価
   - 具体的な改善提案

2. **Gemini レビュー** (約1-2分)
   - セキュリティ脆弱性の検出
   - ベストプラクティスのチェック
   - パフォーマンス最適化の提案

結果はPRのコメントとして投稿されます。

### 手動での自動改善実行

PRに以下のコメントを投稿すると、AI自動改善が実行されます：

```
/auto-improve
```

実行内容：

- コードの自動改善案を生成
- 改善前/改善後のコード比較
- 各改善の理由説明
- すぐに適用可能な修正案

### GitHub Copilotの活用

エディタでコーディング中：

1. **コメントベースのコード生成**

   ```javascript
   // HTMLからJSON-LDを抽出する関数を生成
   // DOMParserとquerySelectorAllを使用すること
   ```

2. **リファクタリング支援**
   - コードを選択してCopilot Chatで「このコードをリファクタリング」

3. **レビュー機能**
   - Copilot Chatで「このファイルをレビューして」と依頼

## ワークフロー詳細

### Claude Code レビュー (`claude-code-review.yml`)

**トリガー**: PR作成、更新時

**レビュー観点**:

- コード品質（命名規則、DRY原則、可読性）
- セキュリティ（XSS、認証、入力検証）
- パフォーマンス（効率性、メモリ管理）
- アーキテクチャ（設計パターン、モジュール化）
- テストカバレッジ

**出力形式**:

```markdown
## Claude Code 自動レビュー

### サマリー

[全体評価]

### 検出された問題

- 重要度別の問題リスト
- ファイルと行番号の特定
- 具体的な改善方法

### 全体評価

- コード品質: ★★★★☆
- セキュリティ: ★★★★★
- パフォーマンス: ★★★☆☆
```

### Gemini レビュー (`gemini-code-review.yml`)

**トリガー**: PR作成、更新時

**特徴**:

- Claude Codeと異なる視点でレビュー
- セキュリティとパフォーマンスに重点
- 日本語での詳細な説明

### AI自動改善 (`auto-improve.yml`)

**トリガー**: PRコメントで `/auto-improve` と入力

**改善内容**:

- タイポ、フォーマット修正
- 非推奨APIの更新
- パフォーマンス最適化
- セキュリティ強化
- コード品質向上

**出力**:

- 改善前/後のコード比較
- 各改善の理由説明
- 完全改善版コード

## レビュー結果の活用

### 優先度の判断

AIレビューで検出された問題の優先度：

1. **高優先度（即座に対応）**
   - セキュリティ脆弱性
   - データ損失の危険性
   - パフォーマンスの著しい低下

2. **中優先度（次回リリース前に対応）**
   - コード品質の問題
   - 保守性の低下
   - テストカバレッジ不足

3. **低優先度（改善の余地あり）**
   - コードスタイルの統一
   - コメントの改善
   - ドキュメントの充実

### 複数AIの意見の扱い

- **一致する指摘** → 高確率で改善が必要
- **一方のみの指摘** → 状況に応じて判断
- **相反する提案** → プロジェクトの方針に従って判断

### 自動改善の適用

1. `/auto-improve` で改善案を取得
2. 提案された改善を確認
3. 適切な改善のみを選択して適用
4. テストを実行して動作確認
5. コミット＆プッシュ

## トラブルシューティング

### ワークフローが実行されない

**原因**: 権限設定の問題

**解決方法**:

1. Settings > Actions > General > Workflow permissions
2. "Read and write permissions" を有効化
3. "Allow GitHub Actions to create and approve pull requests" にチェック

### APIキーエラー

**原因**: シークレットが正しく設定されていない

**解決方法**:

1. Settings > Secrets and variables > Actions で確認
2. シークレット名が正確か確認（大文字小文字区別あり）
3. APIキーの有効期限を確認

### レビューが不完全

**原因**: APIのレート制限またはタイムアウト

**解決方法**:

- GitHub Actionsのログを確認
- 必要に応じてワークフローを再実行
- 大規模な変更の場合は、PRを分割

### Geminiワークフローの実行エラー

**原因**: API応答の形式が予期しないもの

**解決方法**:

1. Actionsタブでログを確認
2. エラーメッセージを確認
3. 必要に応じて `gemini-code-review.yml` のエラーハンドリングを調整

## ベストプラクティス

### 効果的なレビューのために

1. **小さなPRを作成**
   - 変更を小さく保つことで、AIが正確にレビュー
   - 1PR = 1機能/1修正が理想

2. **明確なPR説明**
   - 何を変更したか
   - なぜ変更したか
   - テスト方法
     → AIがコンテキストを理解しやすくなる

3. **定期的なレビュー活用**
   - 大きな機能開発の前に `/auto-improve` で現状確認
   - リファクタリング時にAIの意見を参考

### セキュリティ注意事項

- **APIキーの管理**
  - GitHubシークレットに保存（コードにコミットしない）
  - 定期的にローテーション
  - 最小限の権限で運用

- **レビュー内容の扱い**
  - 機密情報がPRに含まれていないか確認
  - AIレビューの提案を盲目的に採用しない
  - 最終判断は人間が行う

## カスタマイズ

### レビュー基準の調整

`.github/copilot-instructions.md` を編集して、プロジェクト固有のルールを追加：

```markdown
## プロジェクト固有のルール

- すべての関数にJSDocコメントを追加
- 非同期処理は必ずasync/awaitを使用
- エラーハンドリングは必須
```

### ワークフローのカスタマイズ

各ワークフローファイル (`.github/workflows/*.yml`) を編集して：

- トリガーの変更
- レビュー観点の追加/削除
- 出力形式の変更
- タイムアウトの調整

### 新しいAIツールの追加

1. `.github/workflows/` に新しいワークフローファイルを作成
2. 必要なシークレットを追加
3. レビュー用のプロンプトを定義
4. このドキュメントに使用方法を追加

## サポート

### 問題報告

Issues タブで報告してください：

- ワークフローのエラー
- 改善提案
- ドキュメントの不備

### 参考リソース

- [Claude Code ドキュメント](https://docs.anthropic.com/claude/docs)
- [Gemini API ドキュメント](https://ai.google.dev/docs)
- [GitHub Copilot ドキュメント](https://docs.github.com/copilot)
- [GitHub Actions ドキュメント](https://docs.github.com/actions)

---

**最終更新**: 2025-10-13
**バージョン**: 1.0.0
