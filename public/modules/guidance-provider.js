/**
 * SEOアドバイス・ガイダンス提供モジュール
 * スコア評価の詳細解説と改善提案を提供
 */

/**
 * 構造化データスコアの詳細ガイダンスを取得
 * @param {number} schemaScore - 構造化データスコア
 * @param {Array} schemas - JSON-LDスキーマ配列
 * @returns {Object} ガイダンス情報
 */
export function getSchemaScoreGuidance(schemaScore, schemas) {
  const guidance = {
    score: schemaScore,
    maxScore: 20,
    level: determineScoreLevel(schemaScore, 20),
    message: '',
    details: [],
    recommendations: [],
    seoImpact: '',
  };

  if (!schemas || schemas.length === 0) {
    guidance.message = '構造化データが検出されていません';
    guidance.details = [
      'JSON-LD形式の構造化データが設定されていない状態です',
      '検索エンジンがページの内容を正確に理解できません',
    ];
    guidance.seoImpact = '低 - 検索結果の表示方法が限定される可能性があります';
    guidance.recommendations = [
      {
        priority: '高',
        title: '構造化データの追加',
        description: 'Schema.orgに準拠したJSON-LDを<head>内に追加してください',
        example: 'Article、Product、LocalBusiness など適切なタイプを選択',
      },
      {
        priority: '高',
        title: 'ページの種類に応じたスキーマ選択',
        description:
          'ブログ記事ならArticle、商品ページならProduct、など最適なタイプを使用してください',
        example: 'ページの内容に最も合致するスキーマタイプを選びます',
      },
    ];
  } else {
    const hasTypeInfo = schemas.some(s => s['@type']);
    const hasMainProperties = schemas.some(s => {
      const mainProps = ['name', 'description', 'url', 'image'];
      return mainProps.some(prop => s[prop]);
    });
    const multipleSchemas = schemas.length > 1;

    if (schemaScore <= 5) {
      guidance.message = '構造化データが検出されましたが、品質が低い状態です';
      guidance.details = [
        `${schemas.length}個のスキーマが見つかりました`,
        hasTypeInfo ? '@typeが設定されているスキーマがあります' : '@typeが不足しています',
        '改善ガイダンスタブで詳細な改善提案を確認できます',
      ];
      guidance.seoImpact = '低～中 - リッチスニペット表示の不足によるSEO効果の低下があります';
      guidance.recommendations = [
        {
          priority: '高',
          title: 'スキーマタイプ別の必須プロパティを追加',
          description:
            '各スキーマタイプ（JobPosting、BlogPosting等）に応じた必須プロパティを設定してください',
          example:
            'JobPostingの場合: title, description, datePosted, validThrough, jobLocation, hiringOrganization, employmentType',
        },
        {
          priority: '中',
          title: '@typeの明示',
          description: 'すべてのスキーマに@typeを明示的に指定',
          example: '例: "@type": "Article" または "@type": "BlogPosting"',
        },
      ];
    } else if (schemaScore <= 10) {
      guidance.message = '構造化データが基本的に設定されていますが、追加情報が不足しています';
      guidance.details = [
        `${schemas.length}個のデータ定義が見つかりました`,
        '基本的な情報は含まれていますが、詳細情報が不足しています',
        '詳細情報を追加すると、検索結果でより多くの情報が表示される可能性があります',
      ];
      guidance.seoImpact = '中 - 検索結果に追加情報が表示される可能性があります';
      guidance.recommendations = [
        {
          priority: '中',
          title: '不足している基本情報を追加する',
          description:
            '各データ定義に、「データの種類」（@type）を明記してください。これでGoogleが内容を正確に判断できます',
          example: '例えば、記事であることを明記すれば、Google検索で記事として扱われやすくなります',
        },
        {
          priority: '中',
          title: '詳細な情報を追加する',
          description:
            '著者名、公開日時、キーワードなど、ページの詳細情報を追加してください。これらが検索結果に表示される可能性があります',
          example: 'ブログ記事の場合：著者名、公開日、記事内容など',
        },
      ];
    } else if (schemaScore <= 15) {
      guidance.message = '構造化データが良好に設定されています';
      guidance.details = [
        `${schemas.length}個のスキーマが検出されました`,
        '@typeと主要プロパティが設定されています',
        '検索結果で充実した情報が表示される状態です',
      ];
      guidance.seoImpact = '高 - Google検索での表示効果が大きく高まります';
      guidance.recommendations = [
        {
          priority: '低',
          title: '詳細プロパティの追加',
          description: '現在設定されていない詳細なプロパティを追加して、さらに充実させる',
          example: 'rating、aggregateRating、availability、priceなど',
        },
        {
          priority: '低',
          title: '複数タイプスキーマの活用',
          description: 'Article かつ NewsArticle など、複数の@typeを使用して表現力を向上',
          example: '"@type": ["Article", "NewsArticle"]',
        },
      ];
    } else {
      guidance.message = '構造化データが最適に設定されています';
      guidance.details = [
        `${schemas.length}個のスキーマが検出されました`,
        '@typeと主要プロパティが適切に設定されています',
        'SEO観点で最良の状態です',
      ];
      guidance.seoImpact = '優秀 - Google検索での表示効果が最大化されています';
      guidance.recommendations = [
        {
          priority: '低',
          title: '維持と定期確認',
          description: '現在の設定を維持しながら、定期的に構造化データテストツールで検証',
          example: 'Google Search Consoleの「リッチ検索結果」セクションを定期確認',
        },
        {
          priority: '低',
          title: 'スキーマの一貫性',
          description: 'すべてのページで一貫した構造化データ形式を使用',
          example: 'ウェブサイト全体でスキーマのバージョンと形式を統一',
        },
      ];
    }
  }

  return guidance;
}

/**
 * スコアのレベルを判定
 */
function determineScoreLevel(score, maxScore) {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return 'excellent';
  if (percentage >= 60) return 'good';
  if (percentage >= 40) return 'fair';
  return 'poor';
}

/**
 * メタタグスコアの詳細ガイダンスを取得
 * @param {number} metaScore - メタタグスコア
 * @param {Object} meta - メタタグ情報
 * @param {Array} issues - 検出された問題
 * @returns {Object} ガイダンス情報
 */
export function getMetaScoreGuidance(metaScore, meta, issues) {
  const guidance = {
    score: metaScore,
    maxScore: 25,
    level: determineScoreLevel(metaScore, 25),
    message: '',
    details: [],
    recommendations: [],
    seoImpact: '',
  };

  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;

  if (metaScore <= 10) {
    guidance.message = 'メタタグの設定が不十分です';
    guidance.seoImpact = '低 - 検索結果の表示が最適化されていません';
  } else if (metaScore <= 15) {
    guidance.message = 'メタタグが基本的に設定されていますが改善の余地があります';
    guidance.seoImpact = '中 - いくつかの修正で検索結果が改善されます';
  } else if (metaScore <= 20) {
    guidance.message = 'メタタグが良好に設定されています';
    guidance.seoImpact = '高 - 検索結果がしっかり表示されます';
  } else {
    guidance.message = 'メタタグが最適に設定されています';
    guidance.seoImpact = '高 - SEO観点で優秀な状態です';
  }

  // 詳細情報
  guidance.details = [
    `エラー: ${errorCount}件、警告: ${warningCount}件`,
    meta.title ? `Title: ${meta.title.substring(0, 50)}...` : 'Title未設定',
    meta.description ? `Description: ${meta.description.substring(0, 50)}...` : 'Description未設定',
    meta.robots ? `Robots: ${meta.robots}` : 'Robots未設定',
  ];

  // 推奨事項
  if (!meta.title) {
    guidance.recommendations.push({
      priority: '高',
      title: 'Titleの設定',
      description: 'ページを説明する簡潔で固有なタイトル（30～70文字）を設定',
      example: '例: "SEO対策ガイド | 2024年版検索エンジン最適化"',
    });
  } else if (meta.titleLength < 30) {
    guidance.recommendations.push({
      priority: '中',
      title: 'Titleが短すぎます',
      description: 'より詳しく、キーワードを含むタイトルに変更（推奨: 30～70文字）',
      example: `現在: "${meta.title}" → 拡張版へ変更`,
    });
  } else if (meta.titleLength > 70) {
    guidance.recommendations.push({
      priority: '中',
      title: 'Titleが長すぎます',
      description: 'タイトルを簡潔にして70文字以内に調整',
      example: `現在: ${meta.titleLength}文字 → 70文字以内に短縮`,
    });
  }

  if (!meta.description) {
    guidance.recommendations.push({
      priority: '高',
      title: 'Descriptionの設定',
      description: 'ページの要約（70～200文字）を設定。検索結果に表示されるテキスト',
      example: '例: "このガイドではSEOの基本から実践的なテクニックまで解説します"',
    });
  } else if (meta.descriptionLength < 70) {
    guidance.recommendations.push({
      priority: '中',
      title: 'Descriptionが短すぎます',
      description: 'より詳しい説明文へ変更（推奨: 70～200文字）',
      example: `現在: "${meta.description}" → より詳しい説明へ`,
    });
  } else if (meta.descriptionLength > 200) {
    guidance.recommendations.push({
      priority: '中',
      title: 'Descriptionが長すぎます',
      description: '概要を200文字以内にまとめる。検索結果では省略されます',
      example: `現在: ${meta.descriptionLength}文字 → 200文字以内に短縮`,
    });
  }

  if (!meta.robots) {
    guidance.recommendations.push({
      priority: '中',
      title: 'Robotsメタタグの設定',
      description:
        'Googleに対して、このページを検索結果に表示するか、ページ内のリンクをたどるかを指示します。通常のページでは「表示して、リンクもたどる」という設定（index,follow）を推奨します。ステージング環境など、検索結果に表示したくないページでは別の設定が必要です',
      example: '<meta name="robots" content="index,follow"> を<head>内に追加します',
    });
  }

  if (meta.robots && meta.robots.includes('noindex')) {
    guidance.recommendations.push({
      priority: '高',
      title: 'noindexが設定されています',
      description: 'noindexが有効な場合、検索結果に表示されません。意図的な場合は問題ありません',
      example: 'ステージング環境やプライベートページ用',
    });
  }

  if (!meta.canonical) {
    guidance.recommendations.push({
      priority: '低',
      title: 'Canonical URLの設定',
      description: 'ページの正規URL。特に複数のURLでアクセス可能な場合は重要',
      example: '<link rel="canonical" href="https://example.com/page">',
    });
  }

  if (!meta.viewport) {
    guidance.recommendations.push({
      priority: '高',
      title: 'Viewportメタタグの設定',
      description: 'モバイル表示を最適化。ほぼすべてのページで必須',
      example: '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    });
  }

  return guidance;
}

/**
 * SNSスコアの詳細ガイダンスを取得
 * @param {number} snsScore - SNSスコア
 * @param {Object} og - Open Graphタグ情報
 * @param {Object} twitter - Twitter Cards情報
 * @returns {Object} ガイダンス情報
 */
export function getSNSScoreGuidance(snsScore, og, twitter) {
  const guidance = {
    score: snsScore,
    maxScore: 15,
    level: determineScoreLevel(snsScore, 15),
    message: '',
    details: [],
    recommendations: [],
    seoImpact: '',
  };

  const ogMissing = ['title', 'description', 'image', 'url', 'type'].filter(k => !og[k]).length;

  if (snsScore === 0) {
    guidance.message = 'SNS共有時の設定が設定されていません';
    guidance.seoImpact = '中 - SNS共有時にページ情報が正しく表示されない可能性があります';
    guidance.recommendations = [
      {
        priority: '中',
        title: 'SNS共有情報の追加',
        description:
          'Facebook、LinkedInなどでのシェア時に、ページのタイトル・説明・画像が正しく表示されるようにタグを設定します',
        example: 'og:title（ページタイトル）、og:description（説明）、og:image（画像URL）など',
      },
    ];
  } else if (snsScore <= 8) {
    guidance.message = 'SNS共有情報が部分的に設定されています';
    guidance.seoImpact = '中 - SNS共有時に一部の情報が不完全に表示される可能性があります';
    guidance.recommendations = [
      {
        priority: '中',
        title: '不足するSNS共有情報を設定',
        description: `現在${5 - ogMissing}個設定、${ogMissing}個不足しています。不足している情報を追加してください`,
        example:
          '不足: ' +
          ['title', 'description', 'image', 'url', 'type'].filter(k => !og[k]).join(', '),
      },
    ];
  } else {
    guidance.message = 'SNS共有情報が適切に設定されています';
    guidance.seoImpact = '高 - SNS共有時にページ情報が正しく表示されます';
    guidance.recommendations = [];
  }

  // 詳細情報
  guidance.details = [
    og.title ? `og:title: 設定済` : `og:title: 未設定`,
    og.description ? `og:description: 設定済` : `og:description: 未設定`,
    og.image ? `og:image: 設定済` : `og:image: 未設定`,
    og.url ? `og:url: 設定済` : `og:url: 未設定`,
    og.type ? `og:type: ${og.type}` : `og:type: 未設定`,
  ];

  return guidance;
}

/**
 * 総合スコアに基づく全体的なSEO改善提案を取得
 * @param {number} totalScore - 総合スコア
 * @param {Object} analysisData - 分析データ全体
 * @returns {Object} 改善提案
 */
export function getOverallSEOSuggestions(totalScore, analysisData) {
  const suggestions = {
    totalScore,
    overallLevel: determineScoreLevel(totalScore, 100),
    priority: [],
    tips: [],
  };

  // 優先度付き改善項目
  const items = [];

  if (analysisData.scores.meta < 20) {
    items.push({ priority: 1, area: 'メタタグ', score: analysisData.scores.meta });
  }
  if (analysisData.scores.schema < 15) {
    items.push({ priority: 2, area: '構造化データ', score: analysisData.scores.schema });
  }
  if (analysisData.scores.sns < 12) {
    items.push({ priority: 3, area: 'SNS最適化', score: analysisData.scores.sns });
  }

  suggestions.priority = items.sort((a, b) => a.priority - b.priority).slice(0, 3);

  // スコアレベル別のアドバイス
  if (totalScore < 40) {
    suggestions.tips = [
      'SEO対策が不十分です。メタタグ、構造化データ、SNS最適化すべての分野で改善が必要です。',
      '最初に「メタタグ」から改善を始めることをお勧めします。',
      'Google検索セントラルの資料を参考に、基本的なSEO対策を実施してください。',
    ];
  } else if (totalScore < 60) {
    suggestions.tips = [
      'SEO対策が基本的に実施されていますが、改善の余地があります。',
      '不足しているエリアに焦点を当てて、スコアを上げてください。',
      '定期的にこのツールで分析して、改善状況を確認しましょう。',
    ];
  } else if (totalScore < 80) {
    suggestions.tips = [
      'SEO対策が良好に実施されています。',
      '残りの点数を取得するために、詳細なプロパティの追加を検討してください。',
      'Google Search Consoleで実際の検索パフォーマンスを確認すると参考になります。',
    ];
  } else {
    suggestions.tips = [
      'SEO対策が優秀です。現在の状態を維持してください。',
      '定期的なメンテナンスと、新機能への対応を検討してください。',
      'Google検索セントラルの最新情報をフォローして、アップデートに対応しましょう。',
    ];
  }

  return suggestions;
}

/**
 * スコアに基づいた色を取得
 */
export function getScoreColor(score, maxScore) {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return '#22c55e'; // green
  if (percentage >= 60) return '#eab308'; // yellow
  if (percentage >= 40) return '#f97316'; // orange
  return '#ef4444'; // red
}
