# 認証システムガイド

このドキュメントでは、プロジェクトにおける認証機能の実装方法と将来的な拡張について説明します。

## 目次

1. [現在の実装（Option 1: 簡易版）](#現在の実装option-1-簡易版)
2. [将来的な実装オプション](#将来的な実装オプション)
3. [セキュリティ考慮事項](#セキュリティ考慮事項)
4. [実装ガイドライン](#実装ガイドライン)

---

## 現在の実装（Option 1: 簡易版）

### 概要

Content Upload Reviewer機能に対して、Basic認証ベースの簡易認証を実装しています。

### 実装詳細

#### 1. 認証フロー

```
ユーザーがアップロード機能にアクセス
  ↓
localStorageに認証情報があるか確認
  ↓ NO
認証ダイアログを表示
  ↓
ユーザー名・パスワード入力
  ↓
認証成功後、localStorageに保存
  ↓ YES
APIリクエスト時にAuthorizationヘッダーを付与
  ↓
API側で認証チェック
  ↓
成功: レビュー実行
失敗: 401エラー
```

#### 2. クライアント側実装

**認証情報の保存先**:
- localStorageキー: `jsonld_upload_auth`
- 形式: Base64エンコード（`username:password`）

**認証ダイアログ**:
- モーダル形式で表示
- ユーザー名とパスワードを入力
- 認証情報の記憶機能（localStorage）
- ログアウト機能

**API呼び出し時**:
```javascript
const authHeader = localStorage.getItem('jsonld_upload_auth');
fetch('/api/content-upload-reviewer', {
  headers: {
    'Authorization': `Basic ${authHeader}`
  }
});
```

#### 3. サーバー側実装

**環境変数**:
```bash
UPLOAD_AUTH_USERNAME=admin
UPLOAD_AUTH_PASSWORD=your_secure_password
```

**認証チェック**:
```javascript
function checkAuth(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  const validUsername = process.env.UPLOAD_AUTH_USERNAME;
  const validPassword = process.env.UPLOAD_AUTH_PASSWORD;

  return username === validUsername && password === validPassword;
}
```

#### 4. メリット・デメリット

**メリット**:
- 実装が簡単でメンテナンスしやすい
- ステートレス設計を維持
- 既存のBasic認証の仕組みを再利用
- 初回認証後は自動ログイン
- Vercelのサーバーレス環境と相性が良い

**デメリット**:
- 認証情報がlocalStorageに保存される（XSSリスク）
- トークンの有効期限管理ができない
- 複数ユーザーの管理が困難
- パスワード変更時に全ユーザーが再認証必要

---

## 将来的な実装オプション

### Option 2: JWT トークンベース認証（中級版）

#### 概要

JSON Web Token（JWT）を使用した、より本格的な認証システムです。

#### 実装概要

```
認証フロー:
ユーザーがログイン
  ↓
POST /api/auth で認証
  ↓
JWTトークンを発行（有効期限: 30日）
  ↓
トークンをlocalStorageに保存
  ↓
APIリクエスト時にBearerトークンを付与
  ↓
API側でトークン検証（署名・有効期限チェック）
  ↓
成功: リクエスト処理
失敗: 401エラー（再認証）
```

#### 必要な実装

**1. 認証エンドポイント（`/api/auth`）**:

```javascript
// api/auth.js
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  // 環境変数から認証情報を取得
  const validUsername = process.env.UPLOAD_AUTH_USERNAME;
  const validPassword = process.env.UPLOAD_AUTH_PASSWORD;

  if (username !== validUsername || password !== validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // JWTトークンを発行（有効期限: 30日）
  const token = jwt.sign(
    { username, role: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.status(200).json({ token });
}
```

**2. トークン検証ミドルウェア**:

```javascript
// utils/auth-middleware.js
import jwt from 'jsonwebtoken';

export function verifyToken(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'No token provided' };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, user: decoded };
  } catch (error) {
    return { valid: false, error: 'Invalid or expired token' };
  }
}
```

**3. クライアント側実装**:

```javascript
// ログイン処理
async function login(username, password) {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (response.ok) {
    const { token } = await response.json();
    localStorage.setItem('jsonld_jwt_token', token);
    return true;
  }
  return false;
}

// API呼び出し
async function callAPI(endpoint, data) {
  const token = localStorage.getItem('jsonld_jwt_token');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (response.status === 401) {
    // トークンが無効または期限切れ
    showLoginDialog();
    return null;
  }

  return await response.json();
}
```

**4. 必要な環境変数**:

```bash
UPLOAD_AUTH_USERNAME=admin
UPLOAD_AUTH_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key_here  # 最低32文字の強力なランダム文字列
```

#### メリット

- トークンの有効期限管理が可能（例: 30日間有効）
- トークンにユーザー情報やロールを含められる
- リフレッシュトークンの実装も可能
- より柔軟なアクセス制御
- 将来的に複数ユーザー対応が容易

#### デメリット

- 実装が複雑になる
- JWT検証のオーバーヘッド
- トークンの無効化が困難（ブラックリスト管理が必要）

#### 必要なパッケージ

```bash
pnpm add jsonwebtoken
pnpm add -D @types/jsonwebtoken  # TypeScript使用時
```

---

### Option 3: セッションベース認証（上級版）

#### 概要

サーバー側でセッション情報を管理する従来型の認証方式です。

#### 実装概要

```
認証フロー:
ユーザーがログイン
  ↓
POST /api/auth でセッション作成
  ↓
セッションIDをCookieに保存
  ↓
APIリクエスト時にCookieを自動送信
  ↓
API側でセッションを検証
  ↓
成功: リクエスト処理
失敗: 401エラー
```

#### 必要な実装

**1. セッションストア**:

Vercelのサーバーレス環境ではメモリ内セッションが使えないため、外部ストアが必要です。

**オプションA: Redis（推奨）**:
```javascript
// utils/session-store.js
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.connect();

export async function createSession(userId, data) {
  const sessionId = crypto.randomUUID();
  await redisClient.setEx(
    `session:${sessionId}`,
    60 * 60 * 24 * 30,  // 30日間
    JSON.stringify(data)
  );
  return sessionId;
}

export async function getSession(sessionId) {
  const data = await redisClient.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

export async function deleteSession(sessionId) {
  await redisClient.del(`session:${sessionId}`);
}
```

**オプションB: Vercel KV（Vercel環境専用）**:
```javascript
import { kv } from '@vercel/kv';

export async function createSession(userId, data) {
  const sessionId = crypto.randomUUID();
  await kv.setex(`session:${sessionId}`, 60 * 60 * 24 * 30, JSON.stringify(data));
  return sessionId;
}
```

**2. 認証エンドポイント**:

```javascript
// api/auth.js
import { createSession } from '../utils/session-store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (username !== process.env.UPLOAD_AUTH_USERNAME ||
      password !== process.env.UPLOAD_AUTH_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // セッション作成
  const sessionId = await createSession(username, { username, role: 'user' });

  // Cookieに保存
  res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000; Path=/`);
  res.status(200).json({ success: true });
}
```

**3. セッション検証ミドルウェア**:

```javascript
// utils/auth-middleware.js
import { getSession } from './session-store.js';

export async function verifySession(req, res) {
  const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});

  const sessionId = cookies?.sessionId;

  if (!sessionId) {
    return { valid: false, error: 'No session' };
  }

  const session = await getSession(sessionId);

  if (!session) {
    return { valid: false, error: 'Invalid session' };
  }

  return { valid: true, user: session };
}
```

#### メリット

- セッションの即座の無効化が可能
- セッション情報をサーバー側で管理（セキュア）
- HttpOnly Cookieで XSS攻撃を防御
- 従来型のWebアプリケーションとの統合が容易

#### デメリット

- ステートフルな設計になる（Vercelの制約）
- 外部ストア（Redis等）が必要でコストが増加
- スケーリングが複雑
- 実装コストが高い

#### 必要なパッケージ

```bash
# Redisを使う場合
pnpm add redis

# Vercel KVを使う場合
pnpm add @vercel/kv
```

#### 必要なインフラ

- **Redis**: Upstash Redis（無料枠あり）、Redis Cloud等
- **Vercel KV**: Vercelの有料プラン

---

## セキュリティ考慮事項

### 全オプション共通

1. **HTTPS必須**:
   - 認証情報は必ずHTTPS経由で送信
   - Vercelは自動的にHTTPSを提供

2. **環境変数の管理**:
   - 認証情報は必ず環境変数で管理
   - `.env` ファイルは `.gitignore` に追加
   - Vercel環境変数は本番とプレビューで分ける

3. **CORS設定**:
   - 認証が必要なエンドポイントはCORSを厳格化
   - 許可するオリジンを制限

4. **レート制限**:
   - ログイン試行回数を制限（ブルートフォース攻撃対策）
   - API呼び出し頻度を制限

### Option 1（現在の実装）固有

1. **XSS対策**:
   - localStorageはXSS攻撃に脆弱
   - Content Security Policy（CSP）の実装を推奨

2. **認証情報の保護**:
   - パスワードはサーバーログに記録しない
   - ブラウザのMyAPIToolsで認証情報が露出しないよう注意

### Option 2（JWT）固有

1. **JWT Secret**:
   - 最低32文字の強力なランダム文字列を使用
   - 定期的にローテーション

2. **トークンの保存**:
   - localStorageよりもHttpOnly Cookieが推奨
   - ただしVercelのサーバーレス環境では実装が複雑

3. **トークンの無効化**:
   - ブラックリスト管理が必要な場合はRedis等を使用

### Option 3（セッション）固有

1. **セッションIDの生成**:
   - `crypto.randomUUID()` 等で予測不可能なIDを生成

2. **セッションハイジャック対策**:
   - HttpOnly、Secure、SameSite属性を設定
   - IPアドレスやUser-Agentの検証

3. **セッションの有効期限**:
   - 適切な有効期限を設定（例: 30日）
   - アイドルタイムアウトの実装も検討

---

## 実装ガイドライン

### Option 1から Option 2への移行

1. **段階的な移行**:
   ```
   Phase 1: JWT認証の実装（Basic認証と並行稼働）
   Phase 2: フロントエンドをJWTに切り替え
   Phase 3: Basic認証を削除
   ```

2. **後方互換性**:
   ```javascript
   // 両方の認証方式をサポート
   function checkAuth(req, res) {
     // まずJWTをチェック
     if (req.headers.authorization?.startsWith('Bearer ')) {
       return verifyJWT(req, res);
     }
     // フォールバックとしてBasic認証
     if (req.headers.authorization?.startsWith('Basic ')) {
       return verifyBasicAuth(req, res);
     }
     return { valid: false };
   }
   ```

### Option 2から Option 3への移行

1. **外部ストアの準備**:
   - Upstash RedisまたはVercel KVのセットアップ
   - セッションストアの実装

2. **段階的な移行**:
   ```
   Phase 1: セッションストアの実装
   Phase 2: セッション認証の実装（JWTと並行）
   Phase 3: フロントエンドをセッションに切り替え
   Phase 4: JWTを削除
   ```

### テスト戦略

#### Option 1のテスト

```bash
# 認証なしでアクセス（401エラーを期待）
curl -X POST http://localhost:3333/api/content-upload-reviewer \
  -H "Content-Type: application/json" \
  -d '{"reviewType":"blog","content":"test"}'

# 正しい認証情報でアクセス（200を期待）
curl -X POST http://localhost:3333/api/content-upload-reviewer \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'admin:password' | base64)" \
  -d '{"reviewType":"blog","content":"test"}'

# 間違った認証情報でアクセス（401エラーを期待）
curl -X POST http://localhost:3333/api/content-upload-reviewer \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'wrong:wrong' | base64)" \
  -d '{"reviewType":"blog","content":"test"}'
```

#### Option 2のテスト

```bash
# ログイン
TOKEN=$(curl -X POST http://localhost:3333/api/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' | jq -r '.token')

# トークンを使ってAPIにアクセス
curl -X POST http://localhost:3333/api/content-upload-reviewer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reviewType":"blog","content":"test"}'
```

---

## まとめ

### 各オプションの適用シナリオ

| 要件                       | Option 1 | Option 2 | Option 3 |
| -------------------------- | -------- | -------- | -------- |
| 簡単な実装                 | ○        | △        | ×        |
| ステートレス設計           | ○        | ○        | ×        |
| トークン有効期限管理       | ×        | ○        | ○        |
| 即座のログアウト           | ×        | △        | ○        |
| 複数ユーザー対応           | ×        | △        | ○        |
| Vercelサーバーレスとの相性 | ○        | ○        | △        |
| 外部依存なし               | ○        | ○        | ×        |

### 推奨される移行パス

```
現在: Option 1（簡易版）
  ↓
将来（ユーザーが増えたら）: Option 2（JWT）
  ↓
将来（本格的なサービス化）: Option 3（セッション）+ 専用サーバー
```

---

最終更新: 2025-11-13
