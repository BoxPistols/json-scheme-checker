/**
 * アプリケーション全体で使用する定数
 */

// ストレージキー
export const STORAGE_KEYS = {
  AUTH: 'jsonld_basic_auth',
  DOMAIN_AUTH_PREFIX: 'jsonld_auth_',
  STORAGE_METHOD: 'jsonld_storage_method',
  SAMPLE_URLS: 'jsonld_sample_urls',
  THEME: 'jsonld_theme',
  ADVISOR_USAGE: 'jsonld_advisor_usage',
  USER_API_KEY: 'jsonld_user_openai_key',
  STAKEHOLDER_MODE: 'jsonld_advisor_stakeholder',
  BLOG_REVIEWER_USAGE: 'jsonld_blog_reviewer_usage',
  BLOG_REVIEWER_TOTAL: 'jsonld_blog_reviewer_total',
  USAGE_MODE: 'jsonld_usage_mode',
};

// レート制限
export const RATE_LIMITS = {
  NORMAL: 50, // 無料版: 50回/24時間（JST日次リセット）
  DEVELOPER: Infinity, // MyAPIモード: 無制限
};

// タイムアウト設定（ミリ秒）
export const TIMEOUTS = {
  API_REQUEST: 30000, // APIリクエスト: 30秒
  MODAL_ANIMATION: 300, // モーダルアニメーション: 300ms
  SNACKBAR_DURATION: 3000, // スナックバー表示時間: 3秒
};

// SEOスコア配点
export const SEO_SCORES = {
  META: 25, // メタタグ: 25点満点
  SNS: 15, // SNS最適化: 15点満点
  SCHEMA: 20, // 構造化データ: 20点満点
  PERFORMANCE: 20, // パフォーマンス: 20点満点
  ACCESSIBILITY: 20, // アクセシビリティ: 20点満点
  TOTAL: 100, // 合計: 100点満点
};

// メタタグの推奨文字数
export const META_LENGTH = {
  TITLE_MIN: 30,
  TITLE_MAX: 60,
  DESCRIPTION_MIN: 70,
  DESCRIPTION_MAX: 160,
};

// APIエンドポイント
export const API_ENDPOINTS = {
  PROXY: '/proxy',
  HEALTH: '/health',
  ADVISOR: '/api/advisor',
  BLOG_REVIEWER: '/api/blog-reviewer',
  EXTRACT_JSONLD: '/extract-jsonld',
};

// デフォルトサンプルURL
export const DEFAULT_SAMPLE_URLS = [
  'https://json-ld-view.vercel.app/',
  'https://developers.google.com/search/docs/appearance/structured-data/job-posting',
  'https://schema.org/JobPosting',
];

// スキーマタイプ
export const SCHEMA_TYPES = {
  JOB_POSTING: 'JobPosting',
  BLOG_POSTING: 'BlogPosting',
  ARTICLE: 'Article',
  ORGANIZATION: 'Organization',
  PERSON: 'Person',
  WEB_PAGE: 'WebPage',
  WEB_SITE: 'WebSite',
  BREADCRUMB_LIST: 'BreadcrumbList',
};

// HTTPステータスコード
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

// テーマ
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

// 認証ストレージモード
export const AUTH_STORAGE_MODES = {
  NONE: 'none', // 保存しない
  SESSION: 'session', // セッション（タブを閉じるまで）
  PERSISTENT_24H: 'persistent', // 24時間保存
  PERMANENT: 'permanent', // 永続保存
};

// アニメーションクラス
export const ANIMATION_CLASSES = {
  FADE_IN: 'fade-in',
  FADE_OUT: 'fade-out',
  SLIDE_IN: 'slide-in',
  SLIDE_OUT: 'slide-out',
  ACTIVE: 'active',
};

// SVGアイコンパス
export const ICONS = {
  CLOSE:
    '<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  CHECK:
    '<path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  INFO: '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  WARNING:
    '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  ERROR:
    '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  STAR: '<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  BACK: '<path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  EYE: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>',
  EYE_OFF:
    '<path d="M3 3l18 18" stroke="currentColor" stroke-width="2"/><path d="M21 12s-4 7-9 7c-2.038 0-3.92-.8-5.5-1.9M3 12s4-7 9-7c2.051 0 3.936.808 5.517 1.913" stroke="currentColor" stroke-width="2"/>',
};

// エラーメッセージ
export const ERROR_MESSAGES = {
  INVALID_URL: '有効なURLを入力してください',
  FETCH_FAILED: 'データの取得に失敗しました',
  PARSE_FAILED: 'データの解析に失敗しました',
  NO_JSONLD: 'JSON-LDが見つかりませんでした',
  RATE_LIMIT_EXCEEDED: '利用制限に達しました',
  UNAUTHORIZED: '認証が必要です',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
};
