/**
 * スキーマタイプ別の要件定義
 * 各スキーマタイプの必須・推奨・最適化プロパティを定義
 * これに基づいて詳細採点と致命的欠損判定を行う
 */

export const SCHEMA_REQUIREMENTS = {
  // SoftwareApplication: 一般的なウェブアプリケーション
  'SoftwareApplication': {
    label: 'ソフトウェア/ウェブアプリケーション',
    required: [
      { key: 'name', label: '名前', description: 'アプリケーション名' },
      { key: 'description', label: '説明', description: 'アプリケーションの説明' },
    ],
    recommended: [
      { key: 'applicationCategory', label: 'カテゴリー', description: 'Utility, Productivity など' },
      { key: 'operatingSystem', label: 'OS対応', description: 'Windows, iOS, Web など' },
      { key: 'url', label: 'URL', description: 'アプリケーションのURL' },
      { key: 'image', label: 'イメージ', description: 'アプリケーションのロゴ・スクリーンショット' },
      { key: 'author', label: '作成者', description: 'Organization または Person オブジェクト' },
    ],
    optimization: [
      { key: 'aggregateRating', label: '集計評価', description: 'ユーザー評価（4.5/5など）' },
      { key: 'offers', label: '料金体系', description: '無料/有料、価格情報' },
      { key: 'screenshot', label: 'スクリーンショット', description: '複数のスクリーンショット' },
      { key: 'dateModified', label: '更新日', description: '最終更新日' },
    ],
  },

  // JobPosting: 求人情報（Google for Jobs対応）
  'JobPosting': {
    label: '求人情報',
    required: [
      { key: 'title', label: 'タイトル', description: '職種名' },
      { key: 'description', label: '説明', description: '職務経歴書、職種説明' },
      { key: 'datePosted', label: '掲載日', description: '公開日（ISO 8601形式）' },
      { key: 'validThrough', label: '応募期限', description: '応募締切日（ISO 8601形式）' },
      { key: 'jobLocation', label: '勤務地', description: 'Place オブジェクト' },
      { key: 'hiringOrganization', label: '採用企業', description: 'Organization オブジェクト' },
      { key: 'employmentType', label: '雇用形態', description: 'FULL_TIME, PART_TIME など' },
    ],
    recommended: [
      { key: 'baseSalary', label: '基本給', description: 'PriceSpecification オブジェクト' },
      { key: 'jobBenefits', label: '福利厚生', description: '給与以外の待遇' },
      { key: 'qualifications', label: '必須スキル', description: '求める経験・スキル' },
      { key: 'responsibilities', label: '職務内容', description: 'テキスト形式の職務経歴書' },
      { key: 'experienceRequirements', label: '経験要件', description: '必要な実務経験' },
    ],
    optimization: [
      { key: 'educationRequirements', label: '学歴要件', description: '学位や資格の要件' },
      { key: 'incentiveCompensation', label: 'インセンティブ', description: 'ボーナス、コミッション' },
      { key: 'workHours', label: '勤務時間', description: '勤務形態（フレックスなど）' },
    ],
  },

  // BlogPosting: ブログ記事
  'BlogPosting': {
    label: 'ブログ記事',
    required: [
      { key: 'headline', label: 'タイトル', description: '記事のタイトル' },
      { key: 'datePublished', label: '公開日', description: '記事の公開日' },
    ],
    recommended: [
      { key: 'author', label: '著者', description: 'Person または Organization' },
      { key: 'image', label: 'アイキャッチ', description: '記事のメインイメージ' },
      { key: 'articleBody', label: '本文', description: '記事の本文内容' },
      { key: 'description', label: '説明', description: '短い説明またはプレビュー' },
      { key: 'dateModified', label: '更新日', description: '最終更新日' },
    ],
    optimization: [
      { key: 'commentCount', label: 'コメント数', description: 'コメント数' },
      { key: 'keywords', label: 'キーワード', description: 'SEO用キーワード' },
      { key: 'articleSection', label: 'カテゴリー', description: '記事のカテゴリー分類' },
    ],
  },

  // Article: 汎用記事
  'Article': {
    label: '記事',
    required: [
      { key: 'headline', label: 'タイトル', description: '記事のタイトル' },
      { key: 'datePublished', label: '公開日', description: '記事の公開日' },
    ],
    recommended: [
      { key: 'author', label: '著者', description: 'Person または Organization' },
      { key: 'image', label: 'イメージ', description: '記事のメインイメージ' },
      { key: 'description', label: '説明', description: '記事の説明' },
      { key: 'articleBody', label: '本文', description: '記事の本文' },
    ],
    optimization: [
      { key: 'dateModified', label: '更新日', description: '最終更新日' },
      { key: 'wordCount', label: 'ワード数', description: '記事の文字数' },
    ],
  },

  // NewsArticle: ニュース記事
  'NewsArticle': {
    label: 'ニュース記事',
    required: [
      { key: 'headline', label: 'タイトル', description: 'ニュースのタイトル' },
      { key: 'datePublished', label: '公開日', description: 'ニュースの公開日' },
    ],
    recommended: [
      { key: 'author', label: '著者', description: 'ニュース機関またはジャーナリスト' },
      { key: 'image', label: 'メイン画像', description: 'ニュース関連の画像' },
      { key: 'articleBody', label: '本文', description: 'ニュースの本文' },
      { key: 'description', label: 'リード', description: 'ニュースの要約' },
    ],
    optimization: [
      { key: 'dateModified', label: '更新日', description: '更新日（重要）' },
      { key: 'articleSection', label: 'セクション', description: 'Politics, Technology など' },
    ],
  },

  // Organization: 組織・企業
  'Organization': {
    label: '組織・企業',
    required: [
      { key: 'name', label: '名前', description: '企業名・組織名' },
    ],
    recommended: [
      { key: 'url', label: 'URL', description: '公式ウェブサイト' },
      { key: 'image', label: 'ロゴ', description: '企業ロゴ' },
      { key: 'description', label: '説明', description: '企業概要' },
      { key: 'founder', label: '創業者', description: 'Person オブジェクト' },
      { key: 'foundingDate', label: '創立日', description: '創立年月日' },
    ],
    optimization: [
      { key: 'sameAs', label: 'SNS', description: 'SNSプロフィールURL' },
      { key: 'address', label: '住所', description: 'PostalAddress オブジェクト' },
      { key: 'contactPoint', label: '連絡先', description: 'ContactPoint オブジェクト' },
      { key: 'aggregateRating', label: 'レーティング', description: '組織への評価' },
    ],
  },

  // LocalBusiness: ローカルビジネス（店舗等）
  'LocalBusiness': {
    label: 'ローカルビジネス',
    required: [
      { key: 'name', label: 'ビジネス名', description: '店舗名・サービス名' },
      { key: 'address', label: '住所', description: 'PostalAddress オブジェクト' },
    ],
    recommended: [
      { key: 'telephone', label: '電話番号', description: 'ビジネス連絡先' },
      { key: 'url', label: 'URL', description: 'ウェブサイト' },
      { key: 'image', label: 'イメージ', description: 'ビジネスの写真' },
      { key: 'priceRange', label: '料金帯', description: '$$, $$$, $$$$ など' },
      { key: 'openingHoursSpecification', label: '営業時間', description: 'OpeningHoursSpecification' },
    ],
    optimization: [
      { key: 'aggregateRating', label: 'レーティング', description: 'ビジネスへの評価' },
      { key: 'geo', label: '地理情報', description: 'GeoCoordinates オブジェクト' },
    ],
  },

  // Product: 商品
  'Product': {
    label: '商品',
    required: [
      { key: 'name', label: '商品名', description: '商品の名前' },
    ],
    recommended: [
      { key: 'image', label: '画像', description: '商品画像' },
      { key: 'description', label: '説明', description: '商品説明' },
      { key: 'aggregateRating', label: 'レーティング', description: 'ユーザー評価' },
      { key: 'offers', label: 'オファー', description: '価格・在庫情報' },
    ],
    optimization: [
      { key: 'sku', label: 'SKU', description: '商品SKU' },
      { key: 'brand', label: 'ブランド', description: 'Brand オブジェクト' },
      { key: 'review', label: 'レビュー', description: 'Review オブジェクト配列' },
    ],
  },

  // Event: イベント
  'Event': {
    label: 'イベント',
    required: [
      { key: 'name', label: 'イベント名', description: 'イベントの名前' },
      { key: 'startDate', label: '開始日', description: 'イベント開始日時' },
    ],
    recommended: [
      { key: 'endDate', label: '終了日', description: 'イベント終了日時' },
      { key: 'location', label: '場所', description: 'Place オブジェクト' },
      { key: 'description', label: '説明', description: 'イベント説明' },
      { key: 'image', label: 'イメージ', description: 'イベント画像' },
      { key: 'url', label: 'URL', description: 'イベントページのURL' },
      { key: 'offers', label: 'チケット', description: 'Offer オブジェクト' },
    ],
    optimization: [
      { key: 'organizer', label: '開催者', description: 'Organization オブジェクト' },
      { key: 'eventAttendanceMode', label: '形式', description: 'OnlineEventAttendanceMode など' },
    ],
  },
};

/**
 * 指定されたスキーマタイプの要件を取得
 * @param {string} schemaType - スキーマタイプ（例: 'JobPosting'）
 * @returns {Object|null} スキーマ要件オブジェクト、またはタイプが未定義の場合はnull
 */
export function getSchemaRequirements(schemaType) {
  return SCHEMA_REQUIREMENTS[schemaType] || null;
}

/**
 * スキーマの詳細分析結果を生成
 * @param {Object} schema - スキーマオブジェクト
 * @param {Object} requirements - スキーマ要件オブジェクト（getSchemaRequirements() の戻り値）
 * @returns {Object} 詳細分析結果
 */
export function analyzeSchemaDetail(schema, requirements) {
  if (!requirements) {
    return {
      isSupportedType: false,
      checklist: [],
      score: 0,
      maxScore: 0,
      severity: 'info',
      message: 'このスキーマタイプは自動分析の対象外です。手動で検証してください。',
    };
  }

  const checklist = [];
  let score = 0;
  let maxScore = 0;

  // 必須プロパティのチェック
  requirements.required.forEach(prop => {
    maxScore += 3;
    const hasProperty = schema[prop.key] !== undefined && schema[prop.key] !== null && schema[prop.key] !== '';
    checklist.push({
      level: 'required',
      key: prop.key,
      label: prop.label,
      description: prop.description,
      present: hasProperty,
      score: hasProperty ? 3 : 0,
    });
    score += hasProperty ? 3 : 0;
  });

  // 推奨プロパティのチェック
  requirements.recommended.forEach(prop => {
    maxScore += 2;
    const hasProperty = schema[prop.key] !== undefined && schema[prop.key] !== null && schema[prop.key] !== '';
    checklist.push({
      level: 'recommended',
      key: prop.key,
      label: prop.label,
      description: prop.description,
      present: hasProperty,
      score: hasProperty ? 2 : 0,
    });
    score += hasProperty ? 2 : 0;
  });

  // 最適化プロパティのチェック
  requirements.optimization.forEach(prop => {
    maxScore += 1;
    const hasProperty = schema[prop.key] !== undefined && schema[prop.key] !== null && schema[prop.key] !== '';
    checklist.push({
      level: 'optimization',
      key: prop.key,
      label: prop.label,
      description: prop.description,
      present: hasProperty,
      score: hasProperty ? 1 : 0,
    });
    score += hasProperty ? 1 : 0;
  });

  // 致命的欠損の判定
  const missingRequired = checklist.filter(item => item.level === 'required' && !item.present);
  let severity = 'success';
  let message = '完璧です！';

  if (missingRequired.length > 0) {
    severity = 'error';
    message = `致命的な欠損: ${missingRequired.map(item => item.label).join(', ')} が未設定です`;
  } else {
    const missingRecommended = checklist.filter(item => item.level === 'recommended' && !item.present);
    if (missingRecommended.length > 0) {
      severity = 'warning';
      message = `推奨: ${missingRecommended.map(item => item.label).join(', ')} を追加することをお勧めします`;
    }
  }

  return {
    isSupportedType: true,
    checklist,
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    severity,
    message,
    missingRequired: missingRequired.map(item => item.key),
    missingRecommended: checklist.filter(item => item.level === 'recommended' && !item.present).map(item => item.key),
  };
}
