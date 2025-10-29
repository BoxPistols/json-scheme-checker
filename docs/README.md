# ドキュメント

## 主要ドキュメント

- テスト戦略とストーリー
  - 画面単位のストーリーテスト（jsdom）を追加し、異常系（ネットワーク障害、401、スキーマなし、SSEエラー等）を網羅
  - サーバー結合はsupertestでHTTPステータス/CORS/OPTIONSを検証
  - 実行: pnpm test
  - 追加: Web Advisorのセキュリティテスト（SSRFブロック、セッショントークン）

- コーディング規約の追記
  - インラインstyle禁止（CSSへ分離）
  - 1ファイル500行超の禁止（分割）
  - HTMLにJS/CSS内包禁止（別ファイル化、再利用コンポーネント化、デザイントークン化）
  - マジックナンバー禁止（constants.jsへ）

- AIエージェント/Advisor規約
  - タブ内にAIボタンを配置しない（タブ外の共通アクション領域に集約）
  - 共通モーダルUIを使用し、同一意図のUIは統一
  - MyAPI初期化/接続テスト/ヘルス表示をモーダル内で統一

- ストーリー例（抜粋）
  1) URL未入力 -> エラー表示
  2) 不正URL -> エラー表示
  3) サーバーオフライン -> 環境別メッセージ
  4) 401 -> Basic認証セクション自動展開
  5) スキーマなし -> no-data表示とAIボタン重複防止
  6) Web Advisor SSEエラー -> ステータスにエラー

更新: 2025-10-29

- [README.md](../README.md) — プロジェクト概要とセットアップガイド
- [CLAUDE.md](../CLAUDE.md) — Claude Code開発環境ガイド
- [MODEL_PRICING.md](./MODEL_PRICING.md) — OpenAI モデルの料金情報

## 参考リンク

- [Schema.org](https://schema.org/) — 構造化データの仕様
- [JSON-LD](https://json-ld.org/) — リンクトデータ仕様
- [OpenAI API](https://platform.openai.com/) — APIドキュメント
- [Vercel Docs](https://vercel.com/docs) — デプロイメント
