/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';

describe('Web Advisor - Fallback Template Page Nature Detection', () => {
  let generateFallbackTemplate;

  beforeEach(() => {
    // Mock the fallback template generation function
    generateFallbackTemplate = (metadata, _url) => {
      const h2Count = metadata.headings.h2.length;
      const hasTitle = !!metadata.title;
      const bodyLength = metadata.bodySnippet.length;

      // ページの性質を判定（ブログメディア vs 一般的なWebページ）
      const isBlogLike = bodyLength > 1000 && h2Count >= 3 && hasTitle;

      if (isBlogLike) {
        // ブログメディアの場合
        return `## ページの性質判定

このページはブログメディアの特徴を持っています。十分なコンテンツボリュームと複数の見出し構造が確認されます。

## 総合評価

### 構造化データ
BlogPostingスキーマの追加を推奨します`;
      } else {
        // 一般的なWebページの場合
        return `## ページの性質判定

このページは企業サイト、ポートフォリオ、ランディングページなど、一般的なWebページと判定されます。

## 総合評価

### 構造化データ
ページの目的に応じた適切なスキーマ（Organization、LocalBusiness、Productなど）の追加を推奨します`;
      }
    };
  });

  describe('Blog-like Content Detection', () => {
    it('should identify blog media when content is long with multiple headings', () => {
      const metadata = {
        title: 'Comprehensive Article Title',
        description: 'This is a detailed article description',
        headings: {
          h1: ['Main Title'],
          h2: ['Section 1', 'Section 2', 'Section 3', 'Section 4'],
          h3: ['Subsection 1', 'Subsection 2'],
        },
        bodySnippet: 'x'.repeat(1500), // 1500 characters (> 1000)
      };

      const template = generateFallbackTemplate(metadata, 'http://example.com');

      expect(template).toContain('ページの性質判定');
      expect(template).toContain('このページはブログメディアの特徴を持っています');
      expect(template).toContain('BlogPostingスキーマの追加を推奨します');
      expect(template).not.toContain('Organization、LocalBusiness、Product');
    });

    it('should recommend BlogPosting schema for blog-like content', () => {
      const metadata = {
        title: 'Article',
        description: 'Description',
        headings: {
          h1: ['Title'],
          h2: ['Intro', 'Main', 'Conclusion', 'More'],
          h3: [],
        },
        bodySnippet: 'x'.repeat(1200),
      };

      const template = generateFallbackTemplate(metadata, 'http://example.com');

      expect(template).toContain('BlogPosting');
    });

    it('should NOT recommend Organization/LocalBusiness for blog content', () => {
      const metadata = {
        title: 'Article',
        description: 'Description',
        headings: {
          h1: ['Title'],
          h2: ['A', 'B', 'C', 'D'],
          h3: [],
        },
        bodySnippet: 'x'.repeat(1200),
      };

      const template = generateFallbackTemplate(metadata, 'http://example.com');

      // Blog template should not mention Organization schema recommendation
      expect(template).not.toContain('Organization、LocalBusiness、Product');
    });
  });

  describe('General Webpage Detection', () => {
    it('should identify general webpage when content is short', () => {
      const metadata = {
        title: 'Company Homepage',
        description: 'Welcome to our company',
        headings: {
          h1: ['Company'],
          h2: ['About', 'Services'],
          h3: [],
        },
        bodySnippet: 'x'.repeat(500), // < 1000
      };

      const template = generateFallbackTemplate(metadata, 'http://example.com');

      expect(template).toContain('一般的なWebページと判定されます');
      expect(template).toContain('Organization、LocalBusiness、Product');
      expect(template).not.toContain('このページはブログメディアの特徴を持っています');
    });

    it('should identify general webpage with insufficient headings', () => {
      const metadata = {
        title: 'Page',
        description: 'Description',
        headings: {
          h1: ['Title'],
          h2: ['Section'], // Only 1 (< 3)
          h3: [],
        },
        bodySnippet: 'x'.repeat(1500),
      };

      const template = generateFallbackTemplate(metadata, 'http://example.com');

      expect(template).toContain('一般的なWebページ');
      expect(template).toContain('Organization、LocalBusiness、Product');
    });

    it('should identify general webpage without title', () => {
      const metadata = {
        title: '', // No title
        description: 'Description',
        headings: {
          h1: [],
          h2: ['A', 'B', 'C', 'D'],
          h3: [],
        },
        bodySnippet: 'x'.repeat(1500),
      };

      const template = generateFallbackTemplate(metadata, 'http://example.com');

      expect(template).toContain('一般的なWebページ');
    });

    it('should recommend Organization/LocalBusiness for general pages', () => {
      const metadata = {
        title: 'Company',
        description: 'Our company',
        headings: {
          h1: ['Welcome'],
          h2: ['About'],
          h3: [],
        },
        bodySnippet: 'x'.repeat(500),
      };

      const template = generateFallbackTemplate(metadata, 'http://example.com');

      expect(template).toContain('Organization、LocalBusiness');
    });

    it('should NOT recommend BlogPosting for general pages', () => {
      const metadata = {
        title: 'Company',
        description: 'Company info',
        headings: {
          h1: ['Company'],
          h2: ['About'],
          h3: [],
        },
        bodySnippet: 'x'.repeat(500),
      };

      const template = generateFallbackTemplate(metadata, 'http://example.com');

      expect(template).not.toContain('BlogPostingスキーマの追加を推奨します');
    });
  });

  describe('Edge Cases', () => {
    it('should handle exactly 1000 character body as general webpage', () => {
      const metadata = {
        title: 'Page',
        description: 'Description',
        headings: {
          h1: ['Title'],
          h2: ['A', 'B', 'C', 'D'],
          h3: [],
        },
        bodySnippet: 'x'.repeat(1000), // Exactly 1000 (not > 1000)
      };

      const template = generateFallbackTemplate(metadata, 'http://example.com');

      // 1000 is not > 1000, so isBlogLike should be false
      expect(template).toContain('一般的なWebページ');
    });

    it('should handle exactly 3 h2 headings as potential blog', () => {
      const metadata = {
        title: 'Article',
        description: 'Description',
        headings: {
          h1: ['Title'],
          h2: ['A', 'B', 'C'], // Exactly 3 (>= 3)
          h3: [],
        },
        bodySnippet: 'x'.repeat(1100), // > 1000
      };

      const template = generateFallbackTemplate(metadata, 'http://example.com');

      // Should be blog-like (all conditions met)
      expect(template).toContain('このページはブログメディアの特徴を持っています');
    });

    it('should handle missing title despite long content and headings', () => {
      const metadata = {
        title: '', // No title
        description: 'Description',
        headings: {
          h1: [],
          h2: ['A', 'B', 'C', 'D'],
          h3: [],
        },
        bodySnippet: 'x'.repeat(1200),
      };

      const template = generateFallbackTemplate(metadata, 'http://example.com');

      // Without title, should be general webpage (isBlogLike = false)
      expect(template).toContain('一般的なWebページ');
    });

    it('should handle completely empty metadata', () => {
      const metadata = {
        title: '',
        description: '',
        headings: { h1: [], h2: [], h3: [] },
        bodySnippet: '',
      };

      const template = generateFallbackTemplate(metadata, 'http://example.com');

      expect(template).toBeTruthy();
      expect(template).toContain('ページの性質判定');
    });
  });

  describe('Page Nature Judgment Output', () => {
    it('should include judgment explanation for blog content', () => {
      const metadata = {
        title: 'Article',
        description: 'Description',
        headings: {
          h1: ['Title'],
          h2: ['A', 'B', 'C', 'D'],
          h3: [],
        },
        bodySnippet: 'x'.repeat(1200),
      };

      const template = generateFallbackTemplate(metadata, 'http://example.com');

      expect(template).toContain('## ページの性質判定');
      expect(template).toContain('ブログメディアの特徴');
      expect(template).toContain('コンテンツボリューム');
      expect(template).toContain('見出し構造');
    });

    it('should include judgment explanation for general webpage', () => {
      const metadata = {
        title: 'Page',
        description: 'Description',
        headings: {
          h1: ['Title'],
          h2: ['About'],
          h3: [],
        },
        bodySnippet: 'x'.repeat(500),
      };

      const template = generateFallbackTemplate(metadata, 'http://example.com');

      expect(template).toContain('## ページの性質判定');
      expect(template).toContain('一般的なWebページと判定されます');
      expect(template).toContain('企業サイト、ポートフォリオ、ランディングページ');
    });
  });
});
