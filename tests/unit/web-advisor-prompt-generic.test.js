/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';

describe('Web Advisor - Generic Prompt Generation', () => {
  let mockBuildPrompt;

  beforeEach(() => {
    // Mock the buildPrompt function
    mockBuildPrompt = (metadata, url) => {
      const titleSection = metadata.title ? `タイトル: ${metadata.title}` : 'タイトル: （未設定）';
      const descSection = metadata.description
        ? `説明: ${metadata.description}`
        : '説明: （未設定）';

      return `あなたは経験豊富なWebサイト分析家です。以下のページ情報を分析し、ページの性質を判定した上で、適切な観点からコンテンツ品質、SEO、ユーザビリティについて具体的な改善提案を日本語で提供してください。

【分析対象URL】
${url}

【ページ情報】
${titleSection}
${descSection}

見出し構造:
H1: ${metadata.headings.h1.join(', ') || '（なし）'}
H2: ${metadata.headings.h2.slice(0, 8).join(', ') || '（なし）'}
H3: ${metadata.headings.h3.slice(0, 5).join(', ') || '（なし）'}

本文抜粋（最初の1000文字）:
${metadata.bodySnippet.substring(0, 1000)}...

【重要な制約】
- 絵文字は使用しないでください
- 簡潔で実践的な提案をしてください
- **ページの性質を判定してから分析してください**
  - ブログメディア: 長めの本文、複数のH2見出し、記事らしいタイトルを含むページ
  - 一般的なWebページ: 企業サイト、ポートフォリオ、ランディングページ、製品紹介など

【出力形式】

## ページの性質判定

[このページがブログメディアか一般的なWebページかを判定し、その理由を1-2文で説明してください]`;
    };
  });

  describe('Prompt Structure Validation', () => {
    it('should include "ページの性質を判定してから分析してください" instruction', () => {
      const metadata = {
        title: 'Test',
        description: 'Test description',
        og: {},
        headings: { h1: ['Title'], h2: ['Section'], h3: [] },
        bodySnippet: 'Sample content',
      };

      const prompt = mockBuildPrompt(metadata, 'http://example.com');

      expect(prompt).toContain('ページの性質を判定してから分析してください');
    });

    it('should NOT contain "ブログ記事として評価してください" (old fixed instruction removed)', () => {
      const metadata = {
        title: 'Test',
        description: 'Test',
        og: {},
        headings: { h1: [], h2: [], h3: [] },
        bodySnippet: 'Content',
      };

      const prompt = mockBuildPrompt(metadata, 'http://example.com');

      expect(prompt).not.toContain('ブログ記事として評価してください');
    });

    it('should include "ページの性質判定" output section', () => {
      const metadata = {
        title: 'Test',
        description: 'Test',
        og: {},
        headings: { h1: [], h2: [], h3: [] },
        bodySnippet: 'Content',
      };

      const prompt = mockBuildPrompt(metadata, 'http://example.com');

      expect(prompt).toContain('## ページの性質判定');
    });

    it('should include blog media detection criteria', () => {
      const metadata = {
        title: 'Test Article',
        description: 'Long description',
        og: {},
        headings: { h1: ['Title'], h2: ['Section'], h3: [] },
        bodySnippet: 'Sample content',
      };

      const prompt = mockBuildPrompt(metadata, 'http://example.com');

      expect(prompt).toContain('ブログメディア: 長めの本文、複数のH2見出し、記事らしいタイトル');
    });

    it('should include general webpage detection criteria', () => {
      const metadata = {
        title: 'Company',
        description: 'Company info',
        og: {},
        headings: { h1: [], h2: [], h3: [] },
        bodySnippet: 'Content',
      };

      const prompt = mockBuildPrompt(metadata, 'http://example.com');

      expect(prompt).toContain(
        '一般的なWebページ: 企業サイト、ポートフォリオ、ランディングページ、製品紹介など'
      );
    });

    it('should include URL in analysis target section', () => {
      const url = 'https://example.com/article';
      const metadata = {
        title: 'Test',
        description: 'Test',
        og: {},
        headings: { h1: [], h2: [], h3: [] },
        bodySnippet: 'Content',
      };

      const prompt = mockBuildPrompt(metadata, url);

      expect(prompt).toContain(url);
      expect(prompt).toContain('【分析対象URL】');
    });

    it('should include constraint about emoji usage', () => {
      const metadata = {
        title: 'Test',
        description: 'Test',
        og: {},
        headings: { h1: [], h2: [], h3: [] },
        bodySnippet: 'Content',
      };

      const prompt = mockBuildPrompt(metadata, 'http://example.com');

      expect(prompt).toContain('絵文字は使用しないでください');
    });
  });

  describe('Prompt Completeness', () => {
    it('should generate complete prompt with all required sections', () => {
      const metadata = {
        title: 'Article Title',
        description: 'Article description',
        og: { image: 'http://example.com/image.jpg' },
        headings: {
          h1: ['Main Title'],
          h2: ['Section 1', 'Section 2'],
          h3: ['Subsection'],
        },
        bodySnippet: 'Detailed article content here...',
      };

      const prompt = mockBuildPrompt(metadata, 'http://example.com/article');

      expect(prompt).toBeTruthy();
      expect(prompt.length).toBeGreaterThan(300); // Prompt has ~375 characters
      expect(prompt).toContain('ページの性質判定');
      expect(prompt).toContain('Article Title');
      expect(prompt).toContain('Article description');
    });

    it('should handle missing metadata gracefully', () => {
      const metadata = {
        title: '',
        description: '',
        og: {},
        headings: { h1: [], h2: [], h3: [] },
        bodySnippet: '',
      };

      const prompt = mockBuildPrompt(metadata, 'http://example.com');

      expect(prompt).toBeTruthy();
      expect(prompt).not.toContain('undefined');
    });
  });

  describe('Generic Analysis Criteria', () => {
    it('should prompt AI to evaluate both blog and general webpage aspects', () => {
      const metadata = {
        title: 'Test',
        description: 'Test',
        og: {},
        headings: { h1: [], h2: [], h3: [] },
        bodySnippet: 'Content',
      };

      const prompt = mockBuildPrompt(metadata, 'http://example.com');

      // Should have criteria for both types
      expect(prompt).toContain('ブログメディア');
      expect(prompt).toContain('一般的なWebページ');
    });

    it('should include practical and concise instruction', () => {
      const metadata = {
        title: 'Test',
        description: 'Test',
        og: {},
        headings: { h1: [], h2: [], h3: [] },
        bodySnippet: 'Content',
      };

      const prompt = mockBuildPrompt(metadata, 'http://example.com');

      expect(prompt).toContain('簡潔で実践的な提案をしてください');
    });
  });
});
