# CORS設定ガイド - 開発サーバー設定（開発者向け）

## TL;DR

Vercel環境からlocalhost URLにアクセスするには、**開発サーバー側でCORSを有効化**してください。

**理由：** ブラウザのセキュリティ制限により、開発サーバーが明示的にアクセスを許可する必要があります。

**注意：** 開発環境のみ有効化を推奨（本番環境では無効化）

---

## 開発サーバー別のCORS設定方法

### Next.js (App Router / Pages Router)

**next.config.js**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // すべてのAPIルートとページに適用
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

**開発専用（推奨）**
```javascript
const nextConfig = {
  async headers() {
    // 開発環境のみCORSを有効化
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/:path*',
          headers: [
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS' },
            { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          ],
        },
      ]
    }
    return []
  },
}
```

---

### Nuxt 3

**nuxt.config.ts**
```typescript
export default defineNuxtConfig({
  // 開発サーバーのCORS設定
  vite: {
    server: {
      cors: true,
    },
  },

  // または、より詳細な設定
  vite: {
    server: {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true,
      },
    },
  },
})
```

**Nitroサーバー設定（APIルート用）**
```typescript
export default defineNuxtConfig({
  nitro: {
    routeRules: {
      '/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    },
  },
})
```

---

### Nuxt 2

**nuxt.config.js**
```javascript
export default {
  // サーバーミドルウェアでCORS設定
  serverMiddleware: [
    (req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

      if (req.method === 'OPTIONS') {
        res.statusCode = 200
        res.end()
        return
      }

      next()
    }
  ],

  // または、@nuxtjs/proxy モジュールを使用
  modules: ['@nuxtjs/axios'],
  axios: {
    proxy: true
  },
}
```

---

### Express.js

**server.js**
```javascript
const express = require('express')
const cors = require('cors')

const app = express()

// すべてのオリジンを許可（開発環境）
app.use(cors())

// または、特定のオリジンのみ許可
app.use(cors({
  origin: ['https://json-ld-view.vercel.app', 'http://localhost:3333'],
  credentials: true,
}))

// ルート定義
app.get('*', (req, res) => {
  // あなたのコード
})

app.listen(3000)
```

---

### Vite (React, Vue, etc.)

**vite.config.js**
```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    cors: true,

    // または、詳細設定
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
    },
  },
})
```

---

## セキュリティ上の注意事項

### 開発環境のみCORSを有効化する

本番環境で `Access-Control-Allow-Origin: *` を設定するのはセキュリティリスクがあります。

**推奨設定：**

```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'development'
    ? '*'
    : ['https://your-production-domain.com'],
  credentials: true,
}
```

---

## トラブルシューティング

### エラー: "CORS policy: No 'Access-Control-Allow-Origin' header"

**原因：** 開発サーバーがCORSヘッダーを返していない

**解決策：**
1. 上記の設定を追加
2. 開発サーバーを再起動
3. ブラウザのキャッシュをクリア（Cmd+Shift+R / Ctrl+Shift+R）

### エラー: "Failed to fetch"

**原因：**
- 開発サーバーが起動していない
- ポート番号が間違っている
- ファイアウォールでブロックされている

**解決策：**
1. 開発サーバーが起動しているか確認
2. URLとポート番号を確認
3. ファイアウォール設定を確認

### Preflight Request (OPTIONS) エラー

一部のブラウザはアクセス前に OPTIONS リクエストを送信します。

**解決策：**
```javascript
// Express例
app.options('*', cors())
```

---

## Basic認証を使用している場合

**CORS + Basic認証の設定例（Express）:**

```javascript
const cors = require('cors')
const basicAuth = require('express-basic-auth')

app.use(cors({
  origin: '*',
  credentials: true, // 重要: 認証情報を許可
}))

app.use(basicAuth({
  users: { 'admin': 'password' },
  challenge: true,
}))
```

**JSON-LDビューア側：**
- Basic認証セクションにユーザー名とパスワードを入力
- ブラウザが自動的にAuthorizationヘッダーを送信

---

## 検証方法

1. 開発サーバーを起動
2. ブラウザのDevToolsを開く（F12）
3. Network タブを確認
4. JSON-LDビューアからアクセス
5. Responseヘッダーに以下が含まれているか確認：
   ```
   Access-Control-Allow-Origin: *
   ```

---

## まとめ

- **Vercel環境でlocalhost URLにアクセスするには開発サーバー側のCORS設定が必須**
- 開発環境のみCORSを有効化することを推奨
- 設定後は必ず開発サーバーを再起動
- 問題が解決しない場合はブラウザのキャッシュをクリア

---

## 参考リンク

- [Next.js CORS設定](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [Nuxt 3 CORS設定](https://nuxt.com/docs/api/nuxt-config#routerules)
- [Express CORS](https://expressjs.com/en/resources/middleware/cors.html)
- [MDN CORS解説](https://developer.mozilla.org/ja/docs/Web/HTTP/CORS)
