#!/bin/bash
set -e
set -e

# AI自動修正システムの動作テストスクリプト

echo "=========================================="
echo "AI自動修正システム 動作テスト"
echo "=========================================="
echo ""

# 現在のブランチを保存
ORIGINAL_BRANCH=$(git branch --show-current)
echo "現在のブランチ: $ORIGINAL_BRANCH"
echo ""

# テストブランチ名
TEST_BRANCH="test/ai-autofix-$(date +%Y%m%d-%H%M%S)"

echo "ステップ1: テストブランチを作成"
git checkout -b "$TEST_BRANCH"
echo "✓ ブランチ作成完了: $TEST_BRANCH"
echo ""

echo "ステップ2: テスト用のエラーファイルを作成"
cat > test-error.js << 'EOF'
// わざとESLintエラーを含むテストファイル

// 未使用の変数
const unused = "test";
const anotherUnused = 123;

// 未使用の関数
function unusedFunc() {
  console.log("This function is never called")
}

// セミコロンなし（Prettierエラー）
const test = "no semicolon"

// インデントエラー
function badIndent() {
    console.log("bad indent")
      console.log("very bad indent")
}

// 未定義の変数を使用
export default undefinedVariable;
EOF

echo "✓ テストファイル作成完了: test-error.js"
echo ""

echo "ステップ3: ファイルをコミット"
git add test-error.js
git commit -m "テスト: AI自動修正システムの動作確認

このコミットには意図的にエラーを含めています：
- ESLintエラー（未使用変数、未定義変数）
- Prettierエラー（フォーマット）

AI自動修正システムがこれらを自動修正することを期待"
echo "✓ コミット完了"
echo ""

echo "ステップ4: リモートにプッシュ"
git push -u origin "$TEST_BRANCH"
echo "✓ プッシュ完了"
echo ""

echo "=========================================="
echo "次の手順:"
echo "=========================================="
echo ""
echo "1. GitHubでPRを作成"
echo "   https://github.com/BoxPistols/json-scheme-checker/compare/$TEST_BRANCH"
echo ""
echo "2. GitHub Actionsタブで実行状況を確認"
echo "   https://github.com/BoxPistols/json-scheme-checker/actions"
echo ""
echo "3. 期待される動作："
echo "   - AI Auto Fix Systemワークフローが自動実行される"
echo "   - 簡単な修正（Lint/Format）が自動適用される"
echo "   - 複雑なエラーについてClaude AIが分析する"
echo "   - 修正内容がPRにコメントされる"
echo "   - 修正がコミットされてプッシュされる"
echo ""
echo "4. 元のブランチに戻るには："
echo "   git checkout $ORIGINAL_BRANCH"
echo ""
echo "=========================================="
echo "テストブランチ作成完了！"
echo "=========================================="
