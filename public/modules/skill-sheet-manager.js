// Skill Sheet Manager - スキルシート（職務経歴書）管理モジュール

/**
 * スキルシートデータ構造のテンプレート
 */
const SKILL_SHEET_TEMPLATE = {
  personalInfo: {
    name: '',
    nameKana: '',
    dateOfBirth: '',
    age: 0,
    gender: '',
    email: '',
    phone: '',
    address: '',
    currentResidence: '', // 現在の居住地
  },
  professionalInfo: {
    occupation: '',
    engineeringRole: '', // エンジニア職種
    managementRole: '', // マネジメント職種
    currentCompany: '', // お勤めの会社
    totalExperience: 0,
    desiredSalary: '',
    desiredLocation: '',
    employmentType: [],
    availableDate: '',
    englishLevel: '', // 英語力（TOEIC、日常会話レベルなど）
  },
  education: [],
  workExperience: [],
  projects: [],
  recentDevelopment: '', // 直近の開発実績
  skills: {
    programmingLanguages: [],
    frameworks: [],
    databases: [],
    infrastructure: [],
    tools: [],
    others: [],
    selfAssessment: '', // 自己申告スキル
    deviation: '', // スキル偏差値
    githubSkills: '', // GitHubスキル
  },
  certifications: [],
  links: {
    github: '',
    githubUsername: '', // GitHubアカウント名
    qiita: '', // Qiitaアカウント
    qiitaUsername: '', // Qiitaアカウント名
    portfolio: '',
    linkedin: '',
    twitter: '',
    blog: '',
    others: [],
  },
  profile: {
    summary: '',
    personality: '', // 人物像
    strengths: '',
    careerGoals: '',
    futureGoals: '', // この先やってみたいこと
    aiUtilization: '', // エンジニアリング領域におけるAI活用
    achievements: '',
  },
  metadata: {
    createdAt: '',
    updatedAt: '',
    version: '1.0',
  },
};

/**
 * スキルシート管理クラス
 * LocalStorageを使用してスキルシートを保存・管理
 */
class SkillSheetManager {
  constructor() {
    this.STORAGE_KEY = 'jsonld_skill_sheet';
    this.HISTORY_KEY = 'jsonld_skill_sheet_history';
    this.MAX_HISTORY = 10;
    this.currentSheet = this.loadSkillSheet();
  }

  /**
   * スキルシートをLocalStorageから読み込み
   * @returns {Object} スキルシートデータ
   */
  loadSkillSheet() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return this.migrateData(data);
      }
      return this.createEmptySheet();
    } catch (error) {
      console.error('[SkillSheetManager] 読み込みエラー:', error);
      return this.createEmptySheet();
    }
  }

  /**
   * 空のスキルシートを作成
   * @returns {Object} 空のスキルシート
   */
  createEmptySheet() {
    const now = new Date().toISOString();
    return {
      ...structuredClone(SKILL_SHEET_TEMPLATE),
      metadata: {
        createdAt: now,
        updatedAt: now,
        version: '1.0',
      },
    };
  }

  /**
   * スキルシートをLocalStorageに保存
   * @param {Object} sheet - 保存するスキルシート
   * @returns {boolean} 保存成功/失敗
   */
  saveSkillSheet(sheet) {
    try {
      sheet.metadata.updatedAt = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sheet));
      this.currentSheet = sheet;
      this.saveToHistory(sheet);
      return true;
    } catch (error) {
      console.error('[SkillSheetManager] 保存エラー:', error);
      return false;
    }
  }

  /**
   * 履歴に保存
   * @param {Object} sheet - 保存するスキルシート
   */
  saveToHistory(sheet) {
    try {
      const history = this.getHistory();
      history.unshift({
        timestamp: new Date().toISOString(),
        data: JSON.parse(JSON.stringify(sheet)),
      });

      // 最大履歴数を超えた場合は古いものを削除
      if (history.length > this.MAX_HISTORY) {
        history.splice(this.MAX_HISTORY);
      }

      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('[SkillSheetManager] 履歴保存エラー:', error);
    }
  }

  /**
   * 履歴を取得
   * @returns {Array} 履歴配列
   */
  getHistory() {
    try {
      const stored = localStorage.getItem(this.HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[SkillSheetManager] 履歴取得エラー:', error);
      return [];
    }
  }

  /**
   * 履歴から復元
   * @param {number} index - 履歴のインデックス
   * @returns {boolean} 復元成功/失敗
   */
  restoreFromHistory(index) {
    try {
      const history = this.getHistory();
      if (index >= 0 && index < history.length) {
        const restoredSheet = history[index].data;
        this.saveSkillSheet(restoredSheet);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[SkillSheetManager] 復元エラー:', error);
      return false;
    }
  }

  /**
   * データマイグレーション（バージョンアップ対応）
   * @param {Object} data - 読み込んだデータ
   * @returns {Object} マイグレーション後のデータ
   */
  migrateData(data) {
    // 将来のバージョンアップ時にデータ構造を変換
    const template = this.createEmptySheet();
    return this.deepMerge(template, data);
  }

  /**
   * オブジェクトのディープマージ
   * @param {Object} target - ターゲット
   * @param {Object} source - ソース
   * @returns {Object} マージ後のオブジェクト
   */
  deepMerge(target, source) {
    const output = { ...target };
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  /**
   * オブジェクトかどうかを判定
   * @param {*} item - 判定対象
   * @returns {boolean} オブジェクトならtrue
   */
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Markdown形式でエクスポート
   * @param {Object} sheet - スキルシート
   * @returns {string} Markdown文字列
   */
  exportToMarkdown(sheet = this.currentSheet) {
    let md = '# 職務経歴書\n\n';

    // 基本情報
    md += this._buildBasicInfoSection(sheet.personalInfo);

    // プロフェッショナル情報
    md += this._buildProfessionalInfoSection(sheet.professionalInfo);

    // ポートフォリオ・リンク
    md += this._buildLinksSection(sheet.links);

    // プロフィール
    md += this._buildProfileSections(sheet.profile);

    // 直近の開発実績
    if (sheet.recentDevelopment) {
      md += this._buildTextSection('直近の開発実績', sheet.recentDevelopment);
    }

    // スキルセット
    md += this._buildSkillsSection(sheet.skills);

    // 資格・認定
    md += this._buildCertificationsSection(sheet.certifications);

    // 職務経歴
    md += this._buildWorkExperienceSection(sheet.workExperience);

    // プロジェクト実績
    md += this._buildProjectsSection(sheet.projects);

    // キャリア関連
    md += this._buildCareerGoalsSection(sheet.profile);

    return md;
  }

  /**
   * 基本情報セクションを構築
   * @private
   */
  _buildBasicInfoSection(personalInfo) {
    let md = '## 基本情報\n\n| 項目 | 内容 |\n|------|------|\n';

    const fields = [
      { key: 'name', label: '氏名' },
      { key: 'nameKana', label: 'フリガナ' },
      { key: 'dateOfBirth', label: '生年月日' },
      { key: 'age', label: '年齢', suffix: '歳' },
      { key: 'currentResidence', label: '居住地' },
      { key: 'email', label: 'メール' },
      { key: 'phone', label: '電話番号' },
    ];

    fields.forEach(({ key, label, suffix = '' }) => {
      if (personalInfo[key]) {
        md += `| ${label} | ${personalInfo[key]}${suffix} |\n`;
      }
    });

    return md + '\n';
  }

  /**
   * プロフェッショナル情報セクションを構築
   * @private
   */
  _buildProfessionalInfoSection(professionalInfo) {
    const hasContent = professionalInfo.occupation || professionalInfo.totalExperience ||
                       professionalInfo.currentCompany;
    if (!hasContent) return '';

    let md = '## プロフェッショナル情報\n\n';

    const fields = [
      { key: 'currentCompany', label: 'お勤めの会社' },
      { key: 'occupation', label: '職種' },
      { key: 'engineeringRole', label: 'エンジニア職種' },
      { key: 'managementRole', label: 'マネジメント職種' },
      { key: 'totalExperience', label: '総経験年数', suffix: '年' },
      { key: 'englishLevel', label: '英語力' },
      { key: 'desiredSalary', label: '希望年収' },
      { key: 'desiredLocation', label: '希望勤務地' },
    ];

    fields.forEach(({ key, label, suffix = '' }) => {
      if (professionalInfo[key]) {
        md += `- ${label}: ${professionalInfo[key]}${suffix}\n`;
      }
    });

    return md + '\n';
  }

  /**
   * リンクセクションを構築
   * @private
   */
  _buildLinksSection(links) {
    const hasLinks = links.github || links.portfolio || links.linkedin ||
                     links.blog || links.qiita;
    if (!hasLinks) return '';

    let md = '## リンク\n\n';

    // GitHubリンク
    if (links.github) {
      md += `- GitHub: ${links.github}`;
      if (links.githubUsername) md += ` (@${links.githubUsername})`;
      md += '\n';
    }

    // Qiitaリンク
    if (links.qiita) {
      md += `- Qiita: ${links.qiita}`;
      if (links.qiitaUsername) md += ` (@${links.qiitaUsername})`;
      md += '\n';
    }

    // その他のリンク
    const otherLinks = [
      { key: 'portfolio', label: 'ポートフォリオ' },
      { key: 'linkedin', label: 'LinkedIn' },
      { key: 'blog', label: 'ブログ' },
    ];

    otherLinks.forEach(({ key, label }) => {
      if (links[key]) {
        md += `- ${label}: ${links[key]}\n`;
      }
    });

    // カスタムリンク
    if (links.others && links.others.length > 0) {
      links.others.forEach(link => {
        if (link.label && link.url) {
          md += `- ${link.label}: ${link.url}\n`;
        }
      });
    }

    return md + '\n';
  }

  /**
   * プロフィールセクションを構築
   * @private
   */
  _buildProfileSections(profile) {
    let md = '';

    const sections = [
      { key: 'summary', title: 'サマリー' },
      { key: 'personality', title: '人物像' },
      { key: 'strengths', title: '強み' },
    ];

    sections.forEach(({ key, title }) => {
      if (profile[key]) {
        md += this._buildTextSection(title, profile[key]);
      }
    });

    return md;
  }

  /**
   * テキストセクションを構築
   * @private
   */
  _buildTextSection(title, content) {
    return `## ${title}\n\n${content}\n\n`;
  }

  /**
   * スキルセクションを構築
   * @private
   */
  _buildSkillsSection(skills) {
    let md = '## スキルセット\n\n';

    // スキルサマリー
    const summaryFields = [
      { key: 'deviation', label: 'スキル偏差値' },
      { key: 'githubSkills', label: 'GitHubスキル' },
      { key: 'selfAssessment', label: '自己申告スキル' },
    ];

    summaryFields.forEach(({ key, label }) => {
      if (skills[key]) {
        md += `**${label}**: ${skills[key]}\n\n`;
      }
    });

    // スキルカテゴリ
    const skillCategories = [
      { key: 'programmingLanguages', label: 'プログラミング言語' },
      { key: 'frameworks', label: 'フレームワーク・ライブラリ' },
      { key: 'databases', label: 'データベース' },
      { key: 'infrastructure', label: 'インフラ・クラウド' },
      { key: 'tools', label: '開発ツール' },
      { key: 'others', label: 'その他' },
    ];

    skillCategories.forEach(({ key, label }) => {
      const categorySkills = skills[key];
      if (categorySkills && categorySkills.length > 0) {
        md += `### ${label}\n\n`;
        categorySkills.forEach(skill => {
          md += `- ${skill.name}`;
          if (skill.experience) md += ` (${skill.experience}年)`;
          if (skill.level) md += ` - ${skill.level}`;
          md += '\n';
        });
        md += '\n';
      }
    });

    return md;
  }

  /**
   * 資格・認定セクションを構築
   * @private
   */
  _buildCertificationsSection(certifications) {
    if (!certifications || certifications.length === 0) return '';

    let md = '## 資格・認定\n\n';
    certifications.forEach(cert => {
      md += `### ${cert.name || '資格名未記入'}\n\n`;
      const fields = [
        { key: 'organization', label: '発行機関' },
        { key: 'acquisitionDate', label: '取得日' },
        { key: 'expirationDate', label: '有効期限' },
        { key: 'url', label: '証明URL' },
      ];
      fields.forEach(({ key, label }) => {
        if (cert[key]) md += `- ${label}: ${cert[key]}\n`;
      });
      md += '\n';
    });
    return md;
  }

  /**
   * 職務経歴セクションを構築
   * @private
   */
  _buildWorkExperienceSection(workExperience) {
    if (!workExperience || workExperience.length === 0) return '';

    let md = '## 職務経歴\n\n';
    workExperience.forEach((exp, index) => {
      md += `### ${index + 1}. ${exp.companyName || '会社名未記入'}\n\n`;
      if (exp.startDate || exp.endDate) {
        md += `**期間**: ${exp.startDate || '開始日未記入'} 〜 ${exp.endDate || '現在'}\n\n`;
      }
      if (exp.position) md += `**役職**: ${exp.position}\n\n`;
      if (exp.department) md += `**部署**: ${exp.department}\n\n`;
      if (exp.responsibilities) md += `**業務内容**:\n${exp.responsibilities}\n\n`;
      if (exp.achievements) md += `**実績**:\n${exp.achievements}\n\n`;
    });
    return md;
  }

  /**
   * プロジェクト実績セクションを構築
   * @private
   */
  _buildProjectsSection(projects) {
    if (!projects || projects.length === 0) return '';

    let md = '## プロジェクト実績\n\n';
    projects.forEach((proj, index) => {
      md += `### ${index + 1}. ${proj.projectName || 'プロジェクト名未記入'}\n\n`;
      if (proj.startDate || proj.endDate) {
        md += `**期間**: ${proj.startDate || '開始日未記入'} 〜 ${proj.endDate || '終了日未記入'}\n\n`;
      }
      if (proj.role) md += `**役割**: ${proj.role}\n\n`;
      if (proj.teamSize) md += `**チーム規模**: ${proj.teamSize}名\n\n`;
      if (proj.description) md += `**概要**:\n${proj.description}\n\n`;
      if (proj.technologies && proj.technologies.length > 0) {
        md += `**使用技術**: ${proj.technologies.join(', ')}\n\n`;
      }
      if (proj.responsibilities) md += `**担当業務**:\n${proj.responsibilities}\n\n`;
      if (proj.achievements) md += `**成果**:\n${proj.achievements}\n\n`;
      if (proj.url) md += `**URL**: ${proj.url}\n\n`;
    });
    return md;
  }

  /**
   * キャリア関連セクションを構築
   * @private
   */
  _buildCareerGoalsSection(profile) {
    let md = '';
    const sections = [
      { key: 'careerGoals', title: 'キャリア目標' },
      { key: 'futureGoals', title: 'この先やってみたいこと' },
      { key: 'aiUtilization', title: 'エンジニアリング領域におけるAI活用' },
    ];
    sections.forEach(({ key, title }) => {
      if (profile[key]) md += this._buildTextSection(title, profile[key]);
    });
    return md;
  }

  /**
   * JSON形式でエクスポート
   * @param {Object} sheet - スキルシート
   * @returns {string} JSON文字列
   */
  exportToJSON(sheet = this.currentSheet) {
    return JSON.stringify(sheet, null, 2);
  }

  /**
   * プレーンテキスト形式でエクスポート
   * @param {Object} sheet - スキルシート
   * @returns {string} テキスト文字列
   */
  exportToText(sheet = this.currentSheet) {
    // Markdownからマークダウン記号を除去
    return this.exportToMarkdown(sheet)
      .replace(/^#+\s/gm, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\|/g, ' ')
      .replace(/^-+$/gm, '');
  }

  /**
   * ファイルからスキルシートをインポート
   * @param {string} content - ファイル内容
   * @param {string} format - ファイル形式（json/markdown/text）
   * @returns {Object|null} パースされたスキルシート、失敗時はnull
   */
  importFromFile(content, format = 'json') {
    try {
      if (format === 'json') {
        const parsed = JSON.parse(content);
        return this.migrateData(parsed);
      }
      // Markdown/Textの場合は簡易的にテキストとして扱う
      return null;
    } catch (error) {
      console.error('[SkillSheetManager] インポートエラー:', error);
      return null;
    }
  }

  /**
   * スキルシートをリセット
   */
  resetSkillSheet() {
    this.currentSheet = this.createEmptySheet();
    this.saveSkillSheet(this.currentSheet);
  }

  /**
   * 現在のスキルシートを取得
   * @returns {Object} 現在のスキルシート
   */
  getCurrentSheet() {
    return this.currentSheet;
  }
}

// グローバルに公開
window.SkillSheetManager = SkillSheetManager;
export default SkillSheetManager;
