/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';

// FileParserはグローバルに定義されるため、スクリプトを読み込む
// Note: 実際の環境ではfile-parser.jsを適切にインポートする必要がある
describe('Content Upload Reviewer - File Parser', () => {
  describe('MAX_FILE_SIZE定数', () => {
    it('10MBに設定されている', async () => {
      // file-parser.jsの読み込み（実際のテスト環境では適切にモック）
      const FileParser = (await import('../../public/utils/file-parser.js')).default;

      expect(FileParser.MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });
  });

  describe('ファイルサイズチェック', () => {
    it('10MBを超えるファイルはエラー', async () => {
      const FileParser = (await import('../../public/utils/file-parser.js')).default;

      // 11MBのファイルをモック
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt', {
        type: 'text/plain',
      });

      await expect(FileParser.parseFile(largeFile)).rejects.toThrow(/ファイルサイズが大きすぎます/);
    });

    it('10MB以下のファイルは処理される', async () => {
      const FileParser = (await import('../../public/utils/file-parser.js')).default;

      // 1MBのテキストファイルをモック
      const smallFile = new File(['x'.repeat(1 * 1024 * 1024)], 'small.txt', {
        type: 'text/plain',
      });

      const result = await FileParser.parseFile(smallFile);
      expect(result.text).toBeTruthy();
      expect(result.metadata.filename).toBe('small.txt');
    });
  });

  describe('対応ファイル形式', () => {
    it('対応形式のリストが正しい', async () => {
      const FileParser = (await import('../../public/utils/file-parser.js')).default;

      const supportedExtensions = FileParser.getSupportedExtensions();
      // 実装ではドットなしで返す
      expect(supportedExtensions).toContain('pdf');
      expect(supportedExtensions).toContain('csv');
      expect(supportedExtensions).toContain('xlsx');
      expect(supportedExtensions).toContain('xls');
      expect(supportedExtensions).toContain('md');
      expect(supportedExtensions).toContain('markdown');
      expect(supportedExtensions).toContain('json');
      expect(supportedExtensions).toContain('txt');
    });

    it('対応していないファイル形式はエラー', async () => {
      const FileParser = (await import('../../public/utils/file-parser.js')).default;

      expect(FileParser.isSupportedFile('test.exe')).toBe(false);
      expect(FileParser.isSupportedFile('test.zip')).toBe(false);
      expect(FileParser.isSupportedFile('test.docx')).toBe(false);
    });

    it('対応しているファイル形式はtrue', async () => {
      const FileParser = (await import('../../public/utils/file-parser.js')).default;

      expect(FileParser.isSupportedFile('test.pdf')).toBe(true);
      expect(FileParser.isSupportedFile('test.csv')).toBe(true);
      expect(FileParser.isSupportedFile('test.txt')).toBe(true);
      expect(FileParser.isSupportedFile('test.json')).toBe(true);
      expect(FileParser.isSupportedFile('test.md')).toBe(true);
    });
  });

  describe('ファイル形式の表示名', () => {
    it('拡張子に応じた表示名を返す', async () => {
      const FileParser = (await import('../../public/utils/file-parser.js')).default;

      // 実装ではドットなしの拡張子を受け取る
      expect(FileParser.getFileTypeDisplayName('pdf')).toBe('PDF');
      expect(FileParser.getFileTypeDisplayName('csv')).toBe('CSV');
      expect(FileParser.getFileTypeDisplayName('xlsx')).toBe('Excel');
      expect(FileParser.getFileTypeDisplayName('md')).toBe('Markdown');
      expect(FileParser.getFileTypeDisplayName('json')).toBe('JSON');
      expect(FileParser.getFileTypeDisplayName('txt')).toBe('テキスト');
    });
  });

  describe('テキストファイルのパース', () => {
    it('テキストファイルの内容を正しく読み込む', async () => {
      const FileParser = (await import('../../public/utils/file-parser.js')).default;

      const content = 'これはテストテキストです';
      const file = new File([content], 'test.txt', { type: 'text/plain' });

      const result = await FileParser.parseFile(file);
      expect(result.text).toBe(content);
      expect(result.metadata.filename).toBe('test.txt');
      // 実装ではドットなしの拡張子を返す
      expect(result.metadata.extension).toBe('txt');
    });
  });

  describe('JSONファイルのパース', () => {
    it('JSONファイルを正しく読み込む', async () => {
      const FileParser = (await import('../../public/utils/file-parser.js')).default;

      const jsonData = { title: 'テスト', content: 'これはテストです' };
      const file = new File([JSON.stringify(jsonData, null, 2)], 'test.json', {
        type: 'application/json',
      });

      const result = await FileParser.parseFile(file);
      expect(result.text).toContain('テスト');
      expect(result.text).toContain('これはテストです');
    });
  });

  describe('Markdownファイルのパース', () => {
    it('Markdownファイルを正しく読み込む', async () => {
      const FileParser = (await import('../../public/utils/file-parser.js')).default;

      const markdown = '# タイトル\n\nこれは**テスト**です。';
      const file = new File([markdown], 'test.md', { type: 'text/markdown' });

      const result = await FileParser.parseFile(file);
      expect(result.text).toBe(markdown);
      // 実装ではドットなしの拡張子を返す
      expect(result.metadata.extension).toBe('md');
    });
  });
});
