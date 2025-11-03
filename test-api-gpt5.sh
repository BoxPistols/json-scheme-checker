#!/bin/bash

# GPT-5-nano API統合テスト

# 環境変数を読み込む
source .env

echo "=== GPT-5-nano API統合テスト ==="
echo ""

# テスト1: test-connection API
echo "--- テスト1: test-connection API ---"
curl -s -X POST http://localhost:3333/api/test-connection \
  -H "Content-Type: application/json" \
  -d "{\"userApiKey\": \"$OPENAI_API_KEY\", \"model\": \"gpt-5-nano\"}" | jq '.'

echo ""
echo "--- テスト2: test-connection API（gpt-5-nano-2025-08-07） ---"
curl -s -X POST http://localhost:3333/api/test-connection \
  -H "Content-Type: application/json" \
  -d "{\"userApiKey\": \"$OPENAI_API_KEY\", \"model\": \"gpt-5-nano-2025-08-07\"}" | jq '.'

echo ""
echo "=== テスト完了 ==="
