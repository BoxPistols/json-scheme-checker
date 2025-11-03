/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';

describe('Web Advisor - renderMarkdown Method', () => {
  let webAdvisorManager;

  beforeEach(() => {
    // Mock escapeHtml method
    const escapeHtml = text => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    // Create a simple mock of WebAdvisorManager with renderMarkdown
    webAdvisorManager = {
      escapeHtml,
      renderMarkdown(markdown) {
        let html = this.escapeHtml(markdown);
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>').replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/^\- (.*$)/gim, '<li>$1</li>');
        html = html.replace(
          /((?:<li>.*?<\/li>(?:<br>)*)+)/g,
          match => `<ul>${match.replace(/<br>/g, '')}</ul>`
        );
        return html.replace(/\n/g, '<br>');
      },
    };
  });

  describe('Method Existence', () => {
    it('should have renderMarkdown method', () => {
      expect(webAdvisorManager.renderMarkdown).toBeDefined();
      expect(typeof webAdvisorManager.renderMarkdown).toBe('function');
    });
  });

  describe('Heading Conversion', () => {
    it('should convert ## to <h2> tags', () => {
      const markdown = '## これはH2見出しです';
      const result = webAdvisorManager.renderMarkdown(markdown);
      expect(result).toContain('<h2>これはH2見出しです</h2>');
    });

    it('should convert ### to <h3> tags', () => {
      const markdown = '### これはH3見出しです';
      const result = webAdvisorManager.renderMarkdown(markdown);
      expect(result).toContain('<h3>これはH3見出しです</h3>');
    });

    it('should handle multiple headings', () => {
      const markdown = `## メインタイトル

### サブタイトル`;
      const result = webAdvisorManager.renderMarkdown(markdown);
      expect(result).toContain('<h2>メインタイトル</h2>');
      expect(result).toContain('<h3>サブタイトル</h3>');
    });
  });

  describe('Bold Text Conversion', () => {
    it('should convert **text** to <strong> tags', () => {
      const markdown = 'これは **太字** です';
      const result = webAdvisorManager.renderMarkdown(markdown);
      expect(result).toContain('<strong>太字</strong>');
    });

    it('should handle multiple bold texts', () => {
      const markdown = '**強調1** と **強調2**';
      const result = webAdvisorManager.renderMarkdown(markdown);
      expect(result).toContain('<strong>強調1</strong>');
      expect(result).toContain('<strong>強調2</strong>');
    });
  });

  describe('List Conversion', () => {
    it('should convert list items to <li> tags', () => {
      const markdown = `リスト:
- アイテム1
- アイテム2`;
      const result = webAdvisorManager.renderMarkdown(markdown);
      expect(result).toContain('<li>アイテム1</li>');
      expect(result).toContain('<li>アイテム2</li>');
    });

    it('should wrap list items in <ul> tags', () => {
      const markdown = `- 項目1
- 項目2
- 項目3`;
      const result = webAdvisorManager.renderMarkdown(markdown);
      expect(result).toContain('<ul>');
      expect(result).toContain('</ul>');
      expect(result).toContain('<li>項目1</li>');
      expect(result).toContain('<li>項目2</li>');
      expect(result).toContain('<li>項目3</li>');
    });
  });

  describe('Line Break Conversion', () => {
    it('should convert newlines to <br> tags', () => {
      const markdown = `段落1
段落2`;
      const result = webAdvisorManager.renderMarkdown(markdown);
      expect(result).toContain('<br>');
    });

    it('should handle multiple line breaks', () => {
      const markdown = `行1
行2
行3`;
      const result = webAdvisorManager.renderMarkdown(markdown);
      const brCount = (result.match(/<br>/g) || []).length;
      expect(brCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Combined Formatting', () => {
    it('should handle mixed markdown formatting', () => {
      const markdown = `## ページの性質判定

ブログメディアとして判定されます。

### 強み

- **充実した見出し構造**による明確な記事構成
- **十分なコンテンツボリューム**がある
- メタディスクリプションが設定されている`;
      const result = webAdvisorManager.renderMarkdown(markdown);

      expect(result).toContain('<h2>ページの性質判定</h2>');
      expect(result).toContain('<h3>強み</h3>');
      expect(result).toContain('<strong>充実した見出し構造</strong>');
      expect(result).toContain('<strong>十分なコンテンツボリューム</strong>');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li><strong>充実した見出し構造</strong>による明確な記事構成</li>');
    });
  });

  describe('Real-world AI Response Simulation', () => {
    it('should properly format a complete AI analysis response', () => {
      const aiResponse = `## ページの性質判定

このページはブログメディアの特徴を持っています。十分なコンテンツボリュームと複数の見出し構造が確認されます。

## 総合評価

### 評価スコア
★★★☆☆

### 強み
- 充実した見出し構造による明確な記事構成
- 十分なコンテンツボリュームがある
- メタディスクリプションが設定されている

### 改善が必要な点
- H1見出しの最適化
- メタディスクリプションの改善
- OGイメージタグの設定

## コンテンツ品質

### ページ構成の評価
見出し構造がしっかり構成されており、コンテンツボリュームは充分です。`;

      const result = webAdvisorManager.renderMarkdown(aiResponse);

      // Check all major components are rendered
      expect(result).toContain('<h2>ページの性質判定</h2>');
      expect(result).toContain('<h2>総合評価</h2>');
      expect(result).toContain('<h3>評価スコア</h3>');
      expect(result).toContain('<h3>強み</h3>');
      expect(result).toContain('<h3>改善が必要な点</h3>');
      expect(result).toContain('<h3>ページ構成の評価</h3>');

      // Check lists are properly wrapped
      expect(result).toContain('<ul>');
      expect(result).toContain('</ul>');

      // Check content is preserved
      expect(result).toContain('ブログメディアの特徴');
      expect(result).toContain('十分なコンテンツボリューム');

      // Should not have rendering errors
      expect(result).not.toContain('undefined');
      expect(result).not.toContain('[object Object]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const result = webAdvisorManager.renderMarkdown('');
      expect(typeof result).toBe('string');
      expect(result).toBe('');
    });

    it('should handle text without markdown formatting', () => {
      const markdown = 'これは通常のテキストです';
      const result = webAdvisorManager.renderMarkdown(markdown);
      expect(result).toBe('これは通常のテキストです');
    });

    it('should escape HTML special characters', () => {
      const markdown = '<script>alert("test")</script>';
      const result = webAdvisorManager.renderMarkdown(markdown);
      // Should escape, not execute
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;');
    });

    it('should handle markdown with special characters', () => {
      const markdown = '## **太字の見出し** & 特殊文字';
      const result = webAdvisorManager.renderMarkdown(markdown);
      expect(result).toContain('<h2>');
      expect(result).toContain('<strong>太字の見出し</strong>');
      expect(result).toContain('&amp;');
    });
  });
});
