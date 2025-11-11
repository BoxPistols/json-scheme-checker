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
      ...JSON.parse(JSON.stringify(SKILL_SHEET_TEMPLATE)),
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
    md += '## 基本情報\n\n';
    md += `| 項目 | 内容 |\n`;
    md += `|------|------|\n`;
    if (sheet.personalInfo.name) md += `| 氏名 | ${sheet.personalInfo.name} |\n`;
    if (sheet.personalInfo.nameKana) md += `| フリガナ | ${sheet.personalInfo.nameKana} |\n`;
    if (sheet.personalInfo.dateOfBirth)
      md += `| 生年月日 | ${sheet.personalInfo.dateOfBirth} |\n`;
    if (sheet.personalInfo.age) md += `| 年齢 | ${sheet.personalInfo.age}歳 |\n`;
    if (sheet.personalInfo.currentResidence)
      md += `| 居住地 | ${sheet.personalInfo.currentResidence} |\n`;
    if (sheet.personalInfo.email) md += `| メール | ${sheet.personalInfo.email} |\n`;
    if (sheet.personalInfo.phone) md += `| 電話番号 | ${sheet.personalInfo.phone} |\n`;
    md += '\n';

    // プロフェッショナル情報
    if (
      sheet.professionalInfo.occupation ||
      sheet.professionalInfo.totalExperience ||
      sheet.professionalInfo.currentCompany
    ) {
      md += '## プロフェッショナル情報\n\n';
      if (sheet.professionalInfo.currentCompany)
        md += `- お勤めの会社: ${sheet.professionalInfo.currentCompany}\n`;
      if (sheet.professionalInfo.occupation)
        md += `- 職種: ${sheet.professionalInfo.occupation}\n`;
      if (sheet.professionalInfo.engineeringRole)
        md += `- エンジニア職種: ${sheet.professionalInfo.engineeringRole}\n`;
      if (sheet.professionalInfo.managementRole)
        md += `- マネジメント職種: ${sheet.professionalInfo.managementRole}\n`;
      if (sheet.professionalInfo.totalExperience)
        md += `- 総経験年数: ${sheet.professionalInfo.totalExperience}年\n`;
      if (sheet.professionalInfo.englishLevel)
        md += `- 英語力: ${sheet.professionalInfo.englishLevel}\n`;
      if (sheet.professionalInfo.desiredSalary)
        md += `- 希望年収: ${sheet.professionalInfo.desiredSalary}\n`;
      if (sheet.professionalInfo.desiredLocation)
        md += `- 希望勤務地: ${sheet.professionalInfo.desiredLocation}\n`;
      md += '\n';
    }

    // ポートフォリオ・リンク
    if (
      sheet.links.github ||
      sheet.links.portfolio ||
      sheet.links.linkedin ||
      sheet.links.blog ||
      sheet.links.qiita
    ) {
      md += '## リンク\n\n';
      if (sheet.links.github) {
        md += `- GitHub: ${sheet.links.github}`;
        if (sheet.links.githubUsername) md += ` (@${sheet.links.githubUsername})`;
        md += '\n';
      }
      if (sheet.links.qiita) {
        md += `- Qiita: ${sheet.links.qiita}`;
        if (sheet.links.qiitaUsername) md += ` (@${sheet.links.qiitaUsername})`;
        md += '\n';
      }
      if (sheet.links.portfolio) md += `- ポートフォリオ: ${sheet.links.portfolio}\n`;
      if (sheet.links.linkedin) md += `- LinkedIn: ${sheet.links.linkedin}\n`;
      if (sheet.links.blog) md += `- ブログ: ${sheet.links.blog}\n`;
      if (sheet.links.others && sheet.links.others.length > 0) {
        sheet.links.others.forEach(link => {
          if (link.label && link.url) {
            md += `- ${link.label}: ${link.url}\n`;
          }
        });
      }
      md += '\n';
    }

    // 自己PR
    if (sheet.profile.summary) {
      md += '## サマリー\n\n';
      md += `${sheet.profile.summary}\n\n`;
    }

    if (sheet.profile.personality) {
      md += '## 人物像\n\n';
      md += `${sheet.profile.personality}\n\n`;
    }

    if (sheet.profile.strengths) {
      md += '## 強み\n\n';
      md += `${sheet.profile.strengths}\n\n`;
    }

    // 直近の開発実績
    if (sheet.recentDevelopment) {
      md += '## 直近の開発実績\n\n';
      md += `${sheet.recentDevelopment}\n\n`;
    }

    // スキルセット
    md += '## スキルセット\n\n';

    // スキル偏差値・GitHubスキル
    if (sheet.skills.deviation) {
      md += `**スキル偏差値**: ${sheet.skills.deviation}\n\n`;
    }
    if (sheet.skills.githubSkills) {
      md += `**GitHubスキル**: ${sheet.skills.githubSkills}\n\n`;
    }
    if (sheet.skills.selfAssessment) {
      md += `**自己申告スキル**: ${sheet.skills.selfAssessment}\n\n`;
    }

    const skillCategories = [
      { key: 'programmingLanguages', label: 'プログラミング言語' },
      { key: 'frameworks', label: 'フレームワーク・ライブラリ' },
      { key: 'databases', label: 'データベース' },
      { key: 'infrastructure', label: 'インフラ・クラウド' },
      { key: 'tools', label: '開発ツール' },
      { key: 'others', label: 'その他' },
    ];

    skillCategories.forEach(({ key, label }) => {
      const skills = sheet.skills[key];
      if (skills && skills.length > 0) {
        md += `### ${label}\n\n`;
        skills.forEach(skill => {
          md += `- ${skill.name}`;
          if (skill.experience) md += ` (${skill.experience}年)`;
          if (skill.level) md += ` - ${skill.level}`;
          md += '\n';
        });
        md += '\n';
      }
    });

    // 資格・認定
    if (sheet.certifications && sheet.certifications.length > 0) {
      md += '## 資格・認定\n\n';
      sheet.certifications.forEach(cert => {
        md += `### ${cert.name}\n\n`;
        if (cert.organization) md += `- 発行機関: ${cert.organization}\n`;
        if (cert.acquisitionDate) md += `- 取得日: ${cert.acquisitionDate}\n`;
        if (cert.expirationDate) md += `- 有効期限: ${cert.expirationDate}\n`;
        if (cert.url) md += `- 証明URL: ${cert.url}\n`;
        md += '\n';
      });
    }

    // 職務経歴
    if (sheet.workExperience && sheet.workExperience.length > 0) {
      md += '## 職務経歴\n\n';
      sheet.workExperience.forEach((exp, index) => {
        md += `### ${index + 1}. ${exp.companyName || '会社名未記入'}\n\n`;
        if (exp.startDate || exp.endDate) {
          md += `**期間**: ${exp.startDate || '開始日未記入'} 〜 ${exp.endDate || '現在'}\n\n`;
        }
        if (exp.position) md += `**役職**: ${exp.position}\n\n`;
        if (exp.department) md += `**部署**: ${exp.department}\n\n`;
        if (exp.responsibilities) {
          md += `**業務内容**:\n${exp.responsibilities}\n\n`;
        }
        if (exp.achievements) {
          md += `**実績**:\n${exp.achievements}\n\n`;
        }
      });
    }

    // プロジェクト実績
    if (sheet.projects && sheet.projects.length > 0) {
      md += '## プロジェクト実績\n\n';
      sheet.projects.forEach((proj, index) => {
        md += `### ${index + 1}. ${proj.projectName || 'プロジェクト名未記入'}\n\n`;
        if (proj.startDate || proj.endDate) {
          md += `**期間**: ${proj.startDate || '開始日未記入'} 〜 ${proj.endDate || '終了日未記入'}\n\n`;
        }
        if (proj.role) md += `**役割**: ${proj.role}\n\n`;
        if (proj.teamSize) md += `**チーム規模**: ${proj.teamSize}名\n\n`;
        if (proj.description) {
          md += `**概要**:\n${proj.description}\n\n`;
        }
        if (proj.technologies && proj.technologies.length > 0) {
          md += `**使用技術**: ${proj.technologies.join(', ')}\n\n`;
        }
        if (proj.responsibilities) {
          md += `**担当業務**:\n${proj.responsibilities}\n\n`;
        }
        if (proj.achievements) {
          md += `**成果**:\n${proj.achievements}\n\n`;
        }
        if (proj.url) {
          md += `**URL**: ${proj.url}\n\n`;
        }
      });
    }

    // キャリア目標
    if (sheet.profile.careerGoals) {
      md += '## キャリア目標\n\n';
      md += `${sheet.profile.careerGoals}\n\n`;
    }

    // この先やってみたいこと
    if (sheet.profile.futureGoals) {
      md += '## この先やってみたいこと\n\n';
      md += `${sheet.profile.futureGoals}\n\n`;
    }

    // AI活用
    if (sheet.profile.aiUtilization) {
      md += '## エンジニアリング領域におけるAI活用\n\n';
      md += `${sheet.profile.aiUtilization}\n\n`;
    }

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
