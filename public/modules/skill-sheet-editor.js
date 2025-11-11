// Skill Sheet Editor - スキルシート編集UI
import SkillSheetManager from './skill-sheet-manager.js';

/**
 * スキルシートエディタークラス
 */
class SkillSheetEditor {
  constructor() {
    this.manager = new SkillSheetManager();
    this.currentSheet = this.manager.getCurrentSheet();
    this.isEditing = false;
    this.autoSaveTimer = null;
  }

  /**
   * エディターモーダルを表示
   */
  showEditor() {
    const existingModal = document.getElementById('skillSheetEditorModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = this.createEditorModal();
    document.body.appendChild(modal);
    modal.style.display = 'flex';

    this.isEditing = true;
    this.loadFormData();
  }

  /**
   * エディターモーダルを閉じる
   */
  closeEditor() {
    const modal = document.getElementById('skillSheetEditorModal');
    if (modal) {
      modal.remove();
    }
    this.isEditing = false;
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
  }

  /**
   * エディターモーダルを作成
   * @returns {HTMLElement} モーダル要素
   */
  createEditorModal() {
    const overlay = document.createElement('div');
    overlay.id = 'skillSheetEditorModal';
    overlay.className = 'modal-overlay';

    const container = document.createElement('div');
    container.className = 'modal-container modal-container--fullscreen';

    const header = this._createHeader();
    const body = this._createBody();
    const footer = this._createFooter();

    container.appendChild(header);
    container.appendChild(body);
    container.appendChild(footer);
    overlay.appendChild(container);

    return overlay;
  }

  /**
   * ヘッダーを作成
   * @returns {HTMLElement}
   */
  _createHeader() {
    const header = document.createElement('div');
    header.className = 'modal-header modal-header--sticky';

    const title = document.createElement('h2');
    title.textContent = 'スキルシート作成・編集';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-modal-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => this.closeEditor());

    header.appendChild(title);
    header.appendChild(closeBtn);

    return header;
  }

  /**
   * ボディを作成（タブUI）
   * @returns {HTMLElement}
   */
  _createBody() {
    const body = document.createElement('div');
    body.className = 'modal-body';

    const tabs = this._createTabs();
    const tabContent = this._createTabContent();

    body.appendChild(tabs);
    body.appendChild(tabContent);

    return body;
  }

  /**
   * タブヘッダーを作成
   * @returns {HTMLElement}
   */
  _createTabs() {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'skill-sheet-tabs';

    const tabs = [
      { id: 'basic', label: '基本情報' },
      { id: 'professional', label: 'プロフェッショナル' },
      { id: 'work', label: '職務経歴' },
      { id: 'projects', label: 'プロジェクト実績' },
      { id: 'skills', label: 'スキル' },
      { id: 'certifications', label: '資格・認定' },
      { id: 'links', label: 'リンク' },
      { id: 'profile', label: 'プロフィール' },
    ];

    tabs.forEach((tab, index) => {
      const tabBtn = document.createElement('button');
      tabBtn.className = index === 0 ? 'skill-sheet-tab active' : 'skill-sheet-tab';
      tabBtn.dataset.tab = tab.id;
      tabBtn.textContent = tab.label;
      tabBtn.addEventListener('click', () => this.switchTab(tab.id));
      tabsContainer.appendChild(tabBtn);
    });

    return tabsContainer;
  }

  /**
   * タブコンテンツを作成
   * @returns {HTMLElement}
   */
  _createTabContent() {
    const contentContainer = document.createElement('div');
    contentContainer.className = 'skill-sheet-tab-content';

    const tabs = [
      { id: 'basic', creator: () => this._createBasicInfoTab() },
      { id: 'professional', creator: () => this._createProfessionalInfoTab() },
      { id: 'work', creator: () => this._createWorkExperienceTab() },
      { id: 'projects', creator: () => this._createProjectsTab() },
      { id: 'skills', creator: () => this._createSkillsTab() },
      { id: 'certifications', creator: () => this._createCertificationsTab() },
      { id: 'links', creator: () => this._createLinksTab() },
      { id: 'profile', creator: () => this._createProfileTab() },
    ];

    tabs.forEach((tab, index) => {
      const panel = document.createElement('div');
      panel.id = `tab-${tab.id}`;
      panel.className =
        index === 0 ? 'skill-sheet-tab-panel active' : 'skill-sheet-tab-panel';
      panel.appendChild(tab.creator());
      contentContainer.appendChild(panel);
    });

    return contentContainer;
  }

  /**
   * タブを切り替え
   * @param {string} tabId - タブID
   */
  switchTab(tabId) {
    document.querySelectorAll('.skill-sheet-tab').forEach(tab => {
      if (tab.dataset.tab === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    document.querySelectorAll('.skill-sheet-tab-panel').forEach(panel => {
      if (panel.id === `tab-${tabId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });
  }

  /**
   * 基本情報タブを作成
   * @returns {HTMLElement}
   */
  _createBasicInfoTab() {
    const section = document.createElement('section');
    section.className = 'skill-sheet-section';

    const fields = [
      { id: 'name', label: '氏名', type: 'text', required: true },
      { id: 'nameKana', label: 'フリガナ', type: 'text' },
      { id: 'dateOfBirth', label: '生年月日', type: 'date' },
      { id: 'age', label: '年齢', type: 'number' },
      { id: 'gender', label: '性別', type: 'select', options: ['男性', '女性', 'その他', '回答しない'] },
      { id: 'email', label: 'メールアドレス', type: 'email' },
      { id: 'phone', label: '電話番号', type: 'tel' },
      { id: 'address', label: '住所', type: 'text' },
      { id: 'currentResidence', label: '現在の居住地', type: 'text' },
    ];

    fields.forEach(field => {
      const formGroup = this._createFormField(field, 'personalInfo');
      section.appendChild(formGroup);
    });

    return section;
  }

  /**
   * プロフェッショナル情報タブを作成
   * @returns {HTMLElement}
   */
  _createProfessionalInfoTab() {
    const section = document.createElement('section');
    section.className = 'skill-sheet-section';

    const fields = [
      { id: 'currentCompany', label: 'お勤めの会社', type: 'text' },
      { id: 'occupation', label: '職種', type: 'text' },
      { id: 'engineeringRole', label: 'エンジニア職種', type: 'text' },
      { id: 'managementRole', label: 'マネジメント職種', type: 'text' },
      { id: 'totalExperience', label: '総経験年数', type: 'number' },
      { id: 'englishLevel', label: '英語力', type: 'text', placeholder: '例: TOEIC 800点、日常会話レベル' },
      { id: 'desiredSalary', label: '希望年収', type: 'text' },
      { id: 'desiredLocation', label: '希望勤務地', type: 'text' },
      { id: 'availableDate', label: '入社可能日', type: 'date' },
    ];

    fields.forEach(field => {
      const formGroup = this._createFormField(field, 'professionalInfo');
      section.appendChild(formGroup);
    });

    return section;
  }

  /**
   * 職務経歴タブを作成
   * @returns {HTMLElement}
   */
  _createWorkExperienceTab() {
    const section = document.createElement('section');
    section.className = 'skill-sheet-section';

    const heading = document.createElement('h3');
    heading.textContent = '職務経歴';

    const addBtn = document.createElement('button');
    addBtn.className = 'btn-primary';
    addBtn.textContent = '職歴を追加';
    addBtn.addEventListener('click', () => this.addWorkExperience());

    const listContainer = document.createElement('div');
    listContainer.id = 'workExperienceList';
    listContainer.className = 'skill-sheet-list';

    section.appendChild(heading);
    section.appendChild(addBtn);
    section.appendChild(listContainer);

    return section;
  }

  /**
   * プロジェクト実績タブを作成
   * @returns {HTMLElement}
   */
  _createProjectsTab() {
    const section = document.createElement('section');
    section.className = 'skill-sheet-section';

    const heading = document.createElement('h3');
    heading.textContent = 'プロジェクト実績';

    const addBtn = document.createElement('button');
    addBtn.className = 'btn-primary';
    addBtn.textContent = 'プロジェクトを追加';
    addBtn.addEventListener('click', () => this.addProject());

    const recentDevField = this._createFormField(
      {
        id: 'recentDevelopment',
        label: '直近の開発実績',
        type: 'textarea',
        placeholder: '直近の開発実績を記載してください',
      },
      'root'
    );

    const listContainer = document.createElement('div');
    listContainer.id = 'projectsList';
    listContainer.className = 'skill-sheet-list';

    section.appendChild(heading);
    section.appendChild(recentDevField);
    section.appendChild(addBtn);
    section.appendChild(listContainer);

    return section;
  }

  /**
   * スキルタブを作成
   * @returns {HTMLElement}
   */
  _createSkillsTab() {
    const section = document.createElement('section');
    section.className = 'skill-sheet-section';

    const heading = document.createElement('h3');
    heading.textContent = 'スキルセット';

    const summaryFields = [
      { id: 'selfAssessment', label: '自己申告スキル', type: 'textarea' },
      { id: 'deviation', label: 'スキル偏差値', type: 'text' },
      { id: 'githubSkills', label: 'GitHubスキル', type: 'textarea' },
    ];

    section.appendChild(heading);

    summaryFields.forEach(field => {
      const formGroup = this._createFormField(field, 'skills');
      section.appendChild(formGroup);
    });

    const categories = [
      { key: 'programmingLanguages', label: 'プログラミング言語' },
      { key: 'frameworks', label: 'フレームワーク・ライブラリ' },
      { key: 'databases', label: 'データベース' },
      { key: 'infrastructure', label: 'インフラ・クラウド' },
      { key: 'tools', label: '開発ツール' },
      { key: 'others', label: 'その他' },
    ];

    categories.forEach(category => {
      const categorySection = document.createElement('div');
      categorySection.className = 'skill-category-section';

      const categoryHeading = document.createElement('h4');
      categoryHeading.textContent = category.label;

      const addSkillBtn = document.createElement('button');
      addSkillBtn.className = 'btn-secondary btn-sm';
      addSkillBtn.textContent = `${category.label}を追加`;
      addSkillBtn.addEventListener('click', () => this.addSkill(category.key));

      const skillList = document.createElement('div');
      skillList.id = `skillList-${category.key}`;
      skillList.className = 'skill-list';

      categorySection.appendChild(categoryHeading);
      categorySection.appendChild(addSkillBtn);
      categorySection.appendChild(skillList);

      section.appendChild(categorySection);
    });

    return section;
  }

  /**
   * 資格・認定タブを作成
   * @returns {HTMLElement}
   */
  _createCertificationsTab() {
    const section = document.createElement('section');
    section.className = 'skill-sheet-section';

    const heading = document.createElement('h3');
    heading.textContent = '資格・認定';

    const addBtn = document.createElement('button');
    addBtn.className = 'btn-primary';
    addBtn.textContent = '資格を追加';
    addBtn.addEventListener('click', () => this.addCertification());

    const listContainer = document.createElement('div');
    listContainer.id = 'certificationsList';
    listContainer.className = 'skill-sheet-list';

    section.appendChild(heading);
    section.appendChild(addBtn);
    section.appendChild(listContainer);

    return section;
  }

  /**
   * リンクタブを作成
   * @returns {HTMLElement}
   */
  _createLinksTab() {
    const section = document.createElement('section');
    section.className = 'skill-sheet-section';

    const fields = [
      { id: 'github', label: 'GitHub URL', type: 'url', placeholder: 'https://github.com/username' },
      { id: 'githubUsername', label: 'GitHubアカウント名', type: 'text', placeholder: 'username' },
      { id: 'qiita', label: 'Qiita URL', type: 'url', placeholder: 'https://qiita.com/username' },
      { id: 'qiitaUsername', label: 'Qiitaアカウント名', type: 'text', placeholder: 'username' },
      { id: 'portfolio', label: 'ポートフォリオURL', type: 'url' },
      { id: 'linkedin', label: 'LinkedIn URL', type: 'url' },
      { id: 'twitter', label: 'Twitter/X URL', type: 'url' },
      { id: 'blog', label: 'ブログURL', type: 'url' },
    ];

    fields.forEach(field => {
      const formGroup = this._createFormField(field, 'links');
      section.appendChild(formGroup);
    });

    return section;
  }

  /**
   * プロフィールタブを作成
   * @returns {HTMLElement}
   */
  _createProfileTab() {
    const section = document.createElement('section');
    section.className = 'skill-sheet-section';

    const fields = [
      { id: 'summary', label: 'サマリー', type: 'textarea', rows: 5 },
      { id: 'personality', label: '人物像', type: 'textarea', rows: 5 },
      { id: 'strengths', label: '強み', type: 'textarea', rows: 5 },
      { id: 'achievements', label: '特筆すべき実績', type: 'textarea', rows: 5 },
      { id: 'careerGoals', label: 'キャリア目標', type: 'textarea', rows: 5 },
      { id: 'futureGoals', label: 'この先やってみたいこと', type: 'textarea', rows: 5 },
      { id: 'aiUtilization', label: 'エンジニアリング領域におけるAI活用', type: 'textarea', rows: 5 },
    ];

    fields.forEach(field => {
      const formGroup = this._createFormField(field, 'profile');
      section.appendChild(formGroup);
    });

    return section;
  }

  /**
   * フォームフィールドを作成
   * @param {Object} field - フィールド定義
   * @param {string} section - セクション名
   * @returns {HTMLElement}
   */
  _createFormField(field, section) {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';

    const label = document.createElement('label');
    label.textContent = field.label;
    if (field.required) {
      const required = document.createElement('span');
      required.className = 'required';
      required.textContent = ' *';
      label.appendChild(required);
    }

    let input;

    if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = field.rows || 3;
    } else if (field.type === 'select') {
      input = document.createElement('select');
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '選択してください';
      input.appendChild(defaultOption);

      if (field.options) {
        field.options.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          input.appendChild(option);
        });
      }
    } else {
      input = document.createElement('input');
      input.type = field.type || 'text';
    }

    input.id = `field-${section}-${field.id}`;
    input.dataset.section = section;
    input.dataset.field = field.id;
    input.className = 'form-input';

    if (field.placeholder) {
      input.placeholder = field.placeholder;
    }

input.addEventListener('input', () => this.scheduleAutoSave());

    formGroup.appendChild(label);
    formGroup.appendChild(input);

    return formGroup;
  }

  /**
   * フッターを作成
   * @returns {HTMLElement}
   */
  _createFooter() {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const leftBtns = document.createElement('div');
    leftBtns.className = 'footer-left';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn-danger';
    resetBtn.textContent = 'リセット';
    resetBtn.addEventListener('click', () => this.resetSheet());

    leftBtns.appendChild(resetBtn);

    const rightBtns = document.createElement('div');
    rightBtns.className = 'footer-right';

    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn-secondary';
    exportBtn.textContent = 'エクスポート';
    exportBtn.addEventListener('click', () => this.showExportOptions());

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-primary';
    saveBtn.textContent = '保存';
    saveBtn.addEventListener('click', () => this.saveSheet());

    const reviewBtn = document.createElement('button');
    reviewBtn.className = 'btn-primary';
    reviewBtn.textContent = 'レビューする';
    reviewBtn.addEventListener('click', () => this.sendToReview());

    rightBtns.appendChild(exportBtn);
    rightBtns.appendChild(saveBtn);
    rightBtns.appendChild(reviewBtn);

    footer.appendChild(leftBtns);
    footer.appendChild(rightBtns);

    return footer;
  }

  /**
   * フォームデータを読み込み
   */
  loadFormData() {
    // 基本情報
    Object.keys(this.currentSheet.personalInfo).forEach(key => {
      const input = document.getElementById(`field-personalInfo-${key}`);
      if (input) {
        input.value = this.currentSheet.personalInfo[key] || '';
      }
    });

    // プロフェッショナル情報
    Object.keys(this.currentSheet.professionalInfo).forEach(key => {
      const input = document.getElementById(`field-professionalInfo-${key}`);
      if (input && !Array.isArray(this.currentSheet.professionalInfo[key])) {
        input.value = this.currentSheet.professionalInfo[key] || '';
      }
    });

    // リンク
    Object.keys(this.currentSheet.links).forEach(key => {
      const input = document.getElementById(`field-links-${key}`);
      if (input && typeof this.currentSheet.links[key] === 'string') {
        input.value = this.currentSheet.links[key] || '';
      }
    });

    // プロフィール
    Object.keys(this.currentSheet.profile).forEach(key => {
      const input = document.getElementById(`field-profile-${key}`);
      if (input) {
        input.value = this.currentSheet.profile[key] || '';
      }
    });

    // スキルサマリー
    const skillSummaryFields = ['selfAssessment', 'deviation', 'githubSkills'];
    skillSummaryFields.forEach(key => {
      const input = document.getElementById(`field-skills-${key}`);
      if (input) {
        input.value = this.currentSheet.skills[key] || '';
      }
    });

    // 直近の開発実績
    const recentDevInput = document.getElementById('field-root-recentDevelopment');
    if (recentDevInput) {
      recentDevInput.value = this.currentSheet.recentDevelopment || '';
    }

    // 配列データ（職歴、プロジェクト、スキル、資格）は後で個別に読み込み
    this.loadWorkExperienceList();
    this.loadProjectsList();
    this.loadSkillsList();
    this.loadCertificationsList();
  }

  /**
   * 職務経歴リストを読み込み
   */
  loadWorkExperienceList() {
    const container = document.getElementById('workExperienceList');
    if (!container) return;

    container.innerHTML = '';
    this.currentSheet.workExperience.forEach((exp, index) => {
      const item = this.createWorkExperienceItem(exp, index);
      container.appendChild(item);
    });
  }

  /**
   * プロジェクトリストを読み込み
   */
  loadProjectsList() {
    const container = document.getElementById('projectsList');
    if (!container) return;

    container.innerHTML = '';
    this.currentSheet.projects.forEach((proj, index) => {
      const item = this.createProjectItem(proj, index);
      container.appendChild(item);
    });
  }

  /**
   * スキルリストを読み込み
   */
  loadSkillsList() {
    const categories = ['programmingLanguages', 'frameworks', 'databases', 'infrastructure', 'tools', 'others'];

    categories.forEach(category => {
      const container = document.getElementById(`skillList-${category}`);
      if (!container) return;

      container.innerHTML = '';
      const skills = this.currentSheet.skills[category] || [];
      skills.forEach((skill, index) => {
        const item = this.createSkillItem(skill, category, index);
        container.appendChild(item);
      });
    });
  }

  /**
   * 資格リストを読み込み
   */
  loadCertificationsList() {
    const container = document.getElementById('certificationsList');
    if (!container) return;

    container.innerHTML = '';
    this.currentSheet.certifications.forEach((cert, index) => {
      const item = this.createCertificationItem(cert, index);
      container.appendChild(item);
    });
  }

  /**
   * 職務経歴アイテムを作成
   * @param {Object} exp - 職務経歴データ
   * @param {number} index - インデックス
   * @returns {HTMLElement}
   */
  createWorkExperienceItem(exp, index) {
    const item = document.createElement('div');
    item.className = 'skill-sheet-list-item';
    const item = document.createElement('div');
    item.className = 'skill-sheet-list-item';
    const companyName = this.escapeHtml(exp.companyName || '会社名未記入');
    const startDate = this.escapeHtml(exp.startDate || '開始日未記入');
    const endDate = this.escapeHtml(exp.endDate || '現在');
    const position = this.escapeHtml(exp.position || '未記入');
    item.innerHTML = `
      <div class="list-item-header">
        <h4>${companyName}</h4>
        <button class="btn-danger btn-sm" data-action="remove-work" data-index="${index}">削除</button>
      </div>
      <div class="list-item-body">
        <p><strong>期間:</strong> ${startDate} 〜 ${endDate}</p>
        <p><strong>役職:</strong> ${position}</p>
      </div>
    `;
    `;

    item.querySelector('[data-action="remove-work"]').addEventListener('click', () => {
      this.removeWorkExperience(index);
    });

    return item;
  }

  /**
   * プロジェクトアイテムを作成
   * @param {Object} proj - プロジェクトデータ
   * @param {number} index - インデックス
   * @returns {HTMLElement}
   */
  createProjectItem(proj, index) {
    const item = document.createElement('div');
    item.className = 'skill-sheet-list-item';
    item.innerHTML = `
      <div class="list-item-header">
        <h4>${proj.projectName || 'プロジェクト名未記入'}</h4>
        <button class="btn-danger btn-sm" data-action="remove-project" data-index="${index}">削除</button>
      </div>
      <div class="list-item-body">
        <p><strong>期間:</strong> ${proj.startDate || '開始日未記入'} 〜 ${proj.endDate || '終了日未記入'}</p>
        <p><strong>役割:</strong> ${proj.role || '未記入'}</p>
      </div>
    `;

    item.querySelector('[data-action="remove-project"]').addEventListener('click', () => {
      this.removeProject(index);
    });

    return item;
  }

  /**
   * スキルアイテムを作成
   * @param {Object} skill - スキルデータ
   * @param {string} category - カテゴリ
   * @param {number} index - インデックス
   * @returns {HTMLElement}
   */
  createSkillItem(skill, category, index) {
    const item = document.createElement('div');
    item.className = 'skill-item';
    item.innerHTML = `
      <span class="skill-name">${skill.name}</span>
      ${skill.experience ? `<span class="skill-experience">${skill.experience}年</span>` : ''}
      ${skill.level ? `<span class="skill-level">${skill.level}</span>` : ''}
      <button class="btn-danger btn-sm" data-action="remove-skill" data-category="${category}" data-index="${index}">削除</button>
    `;

    item.querySelector('[data-action="remove-skill"]').addEventListener('click', () => {
      this.removeSkill(category, index);
    });

    return item;
  }

  /**
   * 資格アイテムを作成
   * @param {Object} cert - 資格データ
   * @param {number} index - インデックス
   * @returns {HTMLElement}
   */
  createCertificationItem(cert, index) {
    const item = document.createElement('div');
    item.className = 'skill-sheet-list-item';
    item.innerHTML = `
      <div class="list-item-header">
        <h4>${cert.name || '資格名未記入'}</h4>
        <button class="btn-danger btn-sm" data-action="remove-cert" data-index="${index}">削除</button>
      </div>
      <div class="list-item-body">
        <p><strong>発行機関:</strong> ${cert.organization || '未記入'}</p>
        <p><strong>取得日:</strong> ${cert.acquisitionDate || '未記入'}</p>
      </div>
    `;

    item.querySelector('[data-action="remove-cert"]').addEventListener('click', () => {
      this.removeCertification(index);
    });

    return item;
  }

  /**
   * 職務経歴を追加
   */
  addWorkExperience() {
    // TODO: モーダルで詳細入力
    this.showSnackbar('職務経歴の追加機能は実装中です');
  }

  /**
   * プロジェクトを追加
   */
  addProject() {
    // TODO: モーダルで詳細入力
    this.showSnackbar('プロジェクトの追加機能は実装中です');
  }

  /**
   * スキルを追加
   * @param {string} category - カテゴリ
   */
  addSkill(category) {
    // TODO: モーダルで詳細入力
    this.showSnackbar('スキルの追加機能は実装中です');
  }

  /**
   * 資格を追加
   */
  addCertification() {
    // TODO: モーダルで詳細入力
    this.showSnackbar('資格の追加機能は実装中です');
  }

  /**
   * 職務経歴を削除
   * @param {number} index - インデックス
   */
  removeWorkExperience(index) {
    this.currentSheet.workExperience.splice(index, 1);
    this.loadWorkExperienceList();
    this.scheduleAutoSave();
  }

  /**
   * プロジェクトを削除
   * @param {number} index - インデックス
   */
  removeProject(index) {
    this.currentSheet.projects.splice(index, 1);
    this.loadProjectsList();
    this.scheduleAutoSave();
  }

  /**
   * スキルを削除
   * @param {string} category - カテゴリ
   * @param {number} index - インデックス
   */
  removeSkill(category, index) {
    this.currentSheet.skills[category].splice(index, 1);
    this.loadSkillsList();
    this.scheduleAutoSave();
  }

  /**
   * 資格を削除
   * @param {number} index - インデックス
   */
  removeCertification(index) {
    this.currentSheet.certifications.splice(index, 1);
    this.loadCertificationsList();
    this.scheduleAutoSave();
  }

  /**
   * 自動保存をスケジュール
   */
  scheduleAutoSave() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    this.autoSaveTimer = setTimeout(() => {
      this.collectFormData();
      this.manager.saveSkillSheet(this.currentSheet);
    }, 1000);
  }

  /**
   * フォームデータを収集
   */
  collectFormData() {
    document.querySelectorAll('.form-input').forEach(input => {
      const section = input.dataset.section;
      const field = input.dataset.field;
      const value = input.value;

      if (section === 'root') {
        this.currentSheet[field] = value;
      } else if (section && field) {
        if (!this.currentSheet[section]) {
          this.currentSheet[section] = {};
        }
        this.currentSheet[section][field] = value;
      }
    });
  }

  /**
   * スキルシートを保存
   */
  saveSheet() {
    this.collectFormData();
    const success = this.manager.saveSkillSheet(this.currentSheet);
    if (success) {
      this.showSnackbar('スキルシートを保存しました');
    } else {
      this.showSnackbar('保存に失敗しました');
    }
  }

  /**
   * スキルシートをリセット
   */
  resetSheet() {
    if (confirm('スキルシートをリセットしますか？この操作は取り消せません。')) {
      this.manager.resetSkillSheet();
      this.currentSheet = this.manager.getCurrentSheet();
      this.loadFormData();
      this.showSnackbar('スキルシートをリセットしました');
    }
  }

  /**
   * エクスポートオプションを表示
   */
  showExportOptions() {
    // TODO: エクスポートモーダルを表示
    this.showSnackbar('エクスポート機能は実装中です');
  }

  /**
   * レビューに送信
   */
  sendToReview() {
    this.collectFormData();
    this.manager.saveSkillSheet(this.currentSheet);

    const markdown = this.manager.exportToMarkdown(this.currentSheet);

    if (window.contentUploadReviewerManager) {
      this.closeEditor();
      window.contentUploadReviewerManager.currentReviewType = 'skill-sheet';
      window.contentUploadReviewerManager.currentContent = markdown;
      window.contentUploadReviewerManager.showUploadModal();

      window.contentUploadReviewerManager.showUploadModal(() => {
        const textArea = document.getElementById('contentTextArea');
        if (textArea) {
          textArea.value = markdown;
        }
      });
    } else {
      this.showSnackbar('レビュー機能が利用できません');
    }
  }

  /**
   * スナックバーを表示
   * @param {string} message - メッセージ
   */
  showSnackbar(message) {
    const snackbar = document.getElementById('snackbar');
    if (snackbar) {
      snackbar.textContent = message;
      snackbar.className = 'snackbar show';
      setTimeout(() => {
        snackbar.className = 'snackbar';
      }, 3000);
    }
  }
}

// グローバルに公開
window.SkillSheetEditor = SkillSheetEditor;
window.skillSheetEditor = new SkillSheetEditor();
export default SkillSheetEditor;
