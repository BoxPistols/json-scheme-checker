// File Parser Utility - ファイルパース用ユーティリティ

/**
 * ファイルパーサークラス
 * 複数のファイル形式（PDF, CSV, Excel, Markdown, JSON, txt）をパースしてテキストを抽出
 */
class FileParser {
  /**
   * ファイルをパースしてテキストを抽出
   * @param {File} file - パース対象のファイル
   * @returns {Promise<{text: string, metadata: object}>} 抽出されたテキストとメタデータ
   */
  static async parseFile(file) {
    const fileExtension = this.getFileExtension(file.name);
    const fileSize = file.size;
    const maxSize = 10 * 1024 * 1024; // 10MB

    // ファイルサイズチェック
    if (fileSize > maxSize) {
      throw new Error(
        `ファイルサイズが大きすぎます（最大10MB）。現在のサイズ: ${(fileSize / 1024 / 1024).toFixed(2)}MB`
      );
    }

    const metadata = {
      filename: file.name,
      size: fileSize,
      type: file.type,
      extension: fileExtension,
      lastModified: new Date(file.lastModified),
    };

    try {
      let text = '';

      switch (fileExtension) {
        case 'pdf':
          text = await this.parsePDF(file);
          break;
        case 'csv':
          text = await this.parseCSV(file);
          break;
        case 'xlsx':
        case 'xls':
          text = await this.parseExcel(file);
          break;
        case 'md':
        case 'markdown':
          text = await this.parseMarkdown(file);
          break;
        case 'json':
          text = await this.parseJSON(file);
          break;
        case 'txt':
        case 'text':
          text = await this.parseText(file);
          break;
        default:
          // 未対応のファイル形式の場合、テキストとして読み込みを試行
          text = await this.parseText(file);
      }

      return { text, metadata };
    } catch (error) {
      console.error('[FileParser] パースエラー:', error);
      throw new Error(`ファイルのパースに失敗しました: ${error.message}`);
    }
  }

  /**
   * ファイル拡張子を取得
   * @param {string} filename - ファイル名
   * @returns {string} 拡張子（小文字）
   */
  static getFileExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }

  /**
   * PDFファイルをパース
   * 注: pdf.jsライブラリが必要（CDNまたはnpm経由）
   * @param {File} file - PDFファイル
   * @returns {Promise<string>} 抽出されたテキスト
   */
  static async parsePDF(file) {
    // pdf.jsが読み込まれているか確認
    if (typeof pdfjsLib === 'undefined') {
      throw new Error(
        'PDF.jsライブラリが読み込まれていません。PDFファイルの解析には外部ライブラリが必要です。'
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += `--- ページ ${i} ---\n${pageText}\n\n`;
    }

    return fullText.trim();
  }

  /**
   * CSVファイルをパース
   * @param {File} file - CSVファイル
   * @returns {Promise<string>} CSVの内容（テキスト形式）
   */
  static async parseCSV(file) {
    const text = await this.readFileAsText(file);
    const lines = text.split('\n').filter(line => line.trim());

    // CSVを整形されたテーブル形式のテキストに変換
    const rows = lines.map(line => this.parseCSVLine(line));

    // 列幅を計算
    const colWidths = this.calculateColumnWidths(rows);

    // 整形されたテキストを生成
    let formattedText = '';
    rows.forEach((row, index) => {
      const formattedRow = row.map((cell, i) => cell.padEnd(colWidths[i])).join(' | ');
      formattedText += formattedRow + '\n';

      // ヘッダー行の後に区切り線を追加
      if (index === 0) {
        formattedText += colWidths.map(width => '-'.repeat(width)).join('-+-') + '\n';
      }
    });

    return formattedText.trim();
  }

  /**
   * CSV行をパース（引用符とカンマのエスケープに対応）
   * @param {string} line - CSV行
   * @returns {Array<string>} パースされたセル配列
   */
  static parseCSVLine(line) {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    cells.push(current.trim());
    return cells;
  }

  /**
   * 列幅を計算
   * @param {Array<Array<string>>} rows - 行データ
   * @returns {Array<number>} 各列の最大幅
   */
  static calculateColumnWidths(rows) {
    if (rows.length === 0) return [];

    const numCols = Math.max(...rows.map(row => row.length));
    const widths = new Array(numCols).fill(0);

    rows.forEach(row => {
      row.forEach((cell, i) => {
        widths[i] = Math.max(widths[i], cell.length);
      });
    });

    return widths;
  }

  /**
   * Excelファイルをパース
   * 注: SheetJS（xlsx）ライブラリが必要
   * @param {File} file - Excelファイル
   * @returns {Promise<string>} 抽出されたテキスト
   */
  static async parseExcel(file) {
    // SheetJSが読み込まれているか確認
    if (typeof XLSX === 'undefined') {
      throw new Error(
        'SheetJS（xlsx）ライブラリが読み込まれていません。Excelファイルの解析には外部ライブラリが必要です。'
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let fullText = '';

    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const csvText = XLSX.utils.sheet_to_csv(worksheet);
      fullText += `--- シート: ${sheetName} ---\n${csvText}\n\n`;
    });

    return fullText.trim();
  }

  /**
   * Markdownファイルをパース
   * @param {File} file - Markdownファイル
   * @returns {Promise<string>} Markdownテキスト
   */
  static async parseMarkdown(file) {
    return await this.readFileAsText(file);
  }

  /**
   * JSONファイルをパース
   * @param {File} file - JSONファイル
   * @returns {Promise<string>} 整形されたJSONテキスト
   */
  static async parseJSON(file) {
    const text = await this.readFileAsText(file);
    try {
      const json = JSON.parse(text);
      return JSON.stringify(json, null, 2);
    } catch (error) {
      throw new Error(`JSON形式が不正です: ${error.message}`);
    }
  }

  /**
   * テキストファイルをパース
   * @param {File} file - テキストファイル
   * @returns {Promise<string>} テキスト内容
   */
  static async parseText(file) {
    return await this.readFileAsText(file);
  }

  /**
   * ファイルをテキストとして読み込み
   * @param {File} file - ファイル
   * @param {string} encoding - エンコーディング（デフォルト: UTF-8）
   * @returns {Promise<string>} ファイルの内容
   */
  static async readFileAsText(file, encoding = 'UTF-8') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = e => {
        resolve(e.target.result);
      };

      reader.onerror = e => {
        reject(new Error('ファイルの読み込みに失敗しました'));
      };

      reader.readAsText(file, encoding);
    });
  }

  /**
   * 対応しているファイル形式のリストを取得
   * @returns {Array<string>} 対応している拡張子のリスト
   */
  static getSupportedExtensions() {
    return ['pdf', 'csv', 'xlsx', 'xls', 'md', 'markdown', 'json', 'txt', 'text'];
  }

  /**
   * ファイルが対応している形式かチェック
   * @param {string} filename - ファイル名
   * @returns {boolean} 対応している場合はtrue
   */
  static isSupportedFile(filename) {
    const extension = this.getFileExtension(filename);
    return this.getSupportedExtensions().includes(extension);
  }

  /**
   * ファイル形式の表示名を取得
   * @param {string} extension - 拡張子
   * @returns {string} 表示名
   */
  static getFileTypeDisplayName(extension) {
    const displayNames = {
      pdf: 'PDF',
      csv: 'CSV',
      xlsx: 'Excel',
      xls: 'Excel',
      md: 'Markdown',
      markdown: 'Markdown',
      json: 'JSON',
      txt: 'テキスト',
      text: 'テキスト',
    };
    return displayNames[extension] || extension.toUpperCase();
  }
}

// グローバルに公開
window.FileParser = FileParser;
