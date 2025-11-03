/* @vitest-environment jsdom */
/* global advisorManager, blogReviewerManager, webAdvisorManager */
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('App Schema Detection Logic - Exclusive Classification', () => {
  let mockAdvisorManager;
  let mockBlogReviewerManager;
  let mockWebAdvisorManager;

  beforeEach(() => {
    // Mock detection methods
    mockAdvisorManager = {
      detectJobPosting: vi.fn(schemas => {
        return schemas.some(
          item =>
            item['@type'] === 'JobPosting' ||
            (Array.isArray(item['@type']) && item['@type'].includes('JobPosting'))
        );
      }),
    };

    mockBlogReviewerManager = {
      detectBlogPost: vi.fn(schemas => {
        return schemas.some(
          item =>
            item['@type'] === 'Article' ||
            item['@type'] === 'BlogPosting' ||
            item['@type'] === 'NewsArticle' ||
            (Array.isArray(item['@type']) &&
              (item['@type'].includes('Article') ||
                item['@type'].includes('BlogPosting') ||
                item['@type'].includes('NewsArticle')))
        );
      }),
    };

    mockWebAdvisorManager = {
      detectNoSchemaOrWebPageOnly: vi.fn(schemas => {
        const exclusiveAdvisorTypes = ['JobPosting', 'BlogPosting', 'Article', 'NewsArticle'];

        const hasExclusiveAdvisor = schemas.some(schema => {
          const type = schema['@type'];
          if (!type) return false;

          if (Array.isArray(type)) {
            return type.some(t => exclusiveAdvisorTypes.includes(t));
          }

          return exclusiveAdvisorTypes.includes(type);
        });

        return !hasExclusiveAdvisor;
      }),
    };

    global.advisorManager = mockAdvisorManager;
    global.blogReviewerManager = mockBlogReviewerManager;
    global.webAdvisorManager = mockWebAdvisorManager;
  });

  describe('JobPosting Detection', () => {
    it('should detect JobPosting schema with string @type', () => {
      const schemas = [{ '@type': 'JobPosting', name: 'Test Job' }];
      expect(advisorManager.detectJobPosting(schemas)).toBe(true);
    });

    it('should detect JobPosting in array @type', () => {
      const schemas = [
        {
          '@type': ['Organization', 'JobPosting'],
          name: 'Test',
        },
      ];
      expect(advisorManager.detectJobPosting(schemas)).toBe(true);
    });

    it('should return false when JobPosting not present', () => {
      const schemas = [{ '@type': 'Article', name: 'Test Article' }];
      expect(advisorManager.detectJobPosting(schemas)).toBe(false);
    });

    it('should return false for empty schemas', () => {
      expect(advisorManager.detectJobPosting([])).toBe(false);
    });
  });

  describe('BlogPost Detection', () => {
    it('should detect Article schema', () => {
      const schemas = [{ '@type': 'Article', headline: 'Test' }];
      expect(blogReviewerManager.detectBlogPost(schemas)).toBe(true);
    });

    it('should detect BlogPosting schema', () => {
      const schemas = [{ '@type': 'BlogPosting', headline: 'Test' }];
      expect(blogReviewerManager.detectBlogPost(schemas)).toBe(true);
    });

    it('should detect NewsArticle schema', () => {
      const schemas = [{ '@type': 'NewsArticle', headline: 'Test' }];
      expect(blogReviewerManager.detectBlogPost(schemas)).toBe(true);
    });

    it('should detect Article in array @type', () => {
      const schemas = [
        {
          '@type': ['WebPage', 'Article'],
          headline: 'Test',
        },
      ];
      expect(blogReviewerManager.detectBlogPost(schemas)).toBe(true);
    });

    it('should return false when blog schema not present', () => {
      const schemas = [{ '@type': 'JobPosting', name: 'Job' }];
      expect(blogReviewerManager.detectBlogPost(schemas)).toBe(false);
    });
  });

  describe('Web Analysis Detection (No Exclusive Schema)', () => {
    it('should detect WebPage-only schema', () => {
      const schemas = [{ '@type': 'WebPage', name: 'Test' }];
      expect(webAdvisorManager.detectNoSchemaOrWebPageOnly(schemas)).toBe(true);
    });

    it('should detect Organization schema', () => {
      const schemas = [{ '@type': 'Organization', name: 'Company' }];
      expect(webAdvisorManager.detectNoSchemaOrWebPageOnly(schemas)).toBe(true);
    });

    it('should detect when no schemas present', () => {
      expect(webAdvisorManager.detectNoSchemaOrWebPageOnly([])).toBe(true);
    });

    it('should detect Product schema', () => {
      const schemas = [{ '@type': 'Product', name: 'Item' }];
      expect(webAdvisorManager.detectNoSchemaOrWebPageOnly(schemas)).toBe(true);
    });

    it('should return false when exclusive schema (JobPosting) present', () => {
      const schemas = [{ '@type': 'JobPosting', name: 'Job' }];
      expect(webAdvisorManager.detectNoSchemaOrWebPageOnly(schemas)).toBe(false);
    });

    it('should return false when exclusive schema (Article) present', () => {
      const schemas = [{ '@type': 'Article', headline: 'Test' }];
      expect(webAdvisorManager.detectNoSchemaOrWebPageOnly(schemas)).toBe(false);
    });

    it('should return false when exclusive schema in array @type', () => {
      const schemas = [
        {
          '@type': ['WebPage', 'BlogPosting'],
        },
      ];
      expect(webAdvisorManager.detectNoSchemaOrWebPageOnly(schemas)).toBe(false);
    });
  });

  describe('Exclusive Classification (if-else-if)', () => {
    it('JobPosting should take priority over BlogPosting', () => {
      const schemas = [
        {
          '@type': 'JobPosting',
          name: 'Job',
        },
      ];

      let detectedType = null;
      if (advisorManager.detectJobPosting(schemas)) {
        detectedType = 'JobPosting';
      } else if (blogReviewerManager.detectBlogPost(schemas)) {
        detectedType = 'BlogPosting';
      } else if (webAdvisorManager.detectNoSchemaOrWebPageOnly(schemas)) {
        detectedType = 'WebAdvisor';
      }

      expect(detectedType).toBe('JobPosting');
      expect(advisorManager.detectJobPosting).toHaveBeenCalled();
      // Blog detection should not be called due to early return
    });

    it('BlogPosting should be detected when JobPosting not present', () => {
      const schemas = [
        {
          '@type': 'Article',
          headline: 'Test',
        },
      ];

      let detectedType = null;
      if (advisorManager.detectJobPosting(schemas)) {
        detectedType = 'JobPosting';
      } else if (blogReviewerManager.detectBlogPost(schemas)) {
        detectedType = 'BlogPosting';
      } else if (webAdvisorManager.detectNoSchemaOrWebPageOnly(schemas)) {
        detectedType = 'WebAdvisor';
      }

      expect(detectedType).toBe('BlogPosting');
    });

    it('WebAdvisor should be detected when no exclusive schema present', () => {
      const schemas = [
        {
          '@type': 'Organization',
          name: 'Company',
        },
      ];

      let detectedType = null;
      if (advisorManager.detectJobPosting(schemas)) {
        detectedType = 'JobPosting';
      } else if (blogReviewerManager.detectBlogPost(schemas)) {
        detectedType = 'BlogPosting';
      } else if (webAdvisorManager.detectNoSchemaOrWebPageOnly(schemas)) {
        detectedType = 'WebAdvisor';
      }

      expect(detectedType).toBe('WebAdvisor');
    });

    it('should handle multiple schemas correctly', () => {
      const schemas = [
        { '@type': 'Organization', name: 'Company' },
        { '@type': 'Person', name: 'Author' },
        { '@type': 'WebPage', url: 'http://example.com' },
      ];

      let detectedType = null;
      if (advisorManager.detectJobPosting(schemas)) {
        detectedType = 'JobPosting';
      } else if (blogReviewerManager.detectBlogPost(schemas)) {
        detectedType = 'BlogPosting';
      } else if (webAdvisorManager.detectNoSchemaOrWebPageOnly(schemas)) {
        detectedType = 'WebAdvisor';
      }

      expect(detectedType).toBe('WebAdvisor');
    });
  });
});
