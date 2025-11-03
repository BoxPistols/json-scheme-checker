/* @vitest-environment jsdom */
/* global advisorManager, blogReviewerManager, webAdvisorManager */
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AI Advisor Button Submit - Loading State Verification', () => {
  let mockAdvisorManager;
  let mockBlogReviewerManager;
  let mockWebAdvisorManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="results"></div>
      <div id="aiActions"></div>
      <div id="loadingIndicator" style="display: none;">Loading...</div>
    `;

    mockAdvisorManager = {
      showAdvisorButton: vi.fn(() => {
        const btn = document.createElement('button');
        btn.id = 'advisorTriggerBtn';
        btn.textContent = '求人/求職アドバイスを受ける';
        btn.setAttribute('data-action', 'openAdvisor');
        document.getElementById('aiActions').appendChild(btn);
      }),
      detectJobPosting: vi.fn(() => true),
      handleSubmit: vi.fn(function () {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
          loader.style.display = 'block';
        }
        return Promise.resolve();
      }),
    };

    mockBlogReviewerManager = {
      showReviewButton: vi.fn(() => {
        const btn = document.createElement('button');
        btn.id = 'blogReviewerTriggerBtn';
        btn.textContent = 'ブログ記事レビュー';
        btn.setAttribute('data-action', 'openBlogReviewer');
        document.getElementById('aiActions').appendChild(btn);
      }),
      detectBlogPost: vi.fn(() => true),
      handleSubmit: vi.fn(function () {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
          loader.style.display = 'block';
        }
        return Promise.resolve();
      }),
    };

    mockWebAdvisorManager = {
      showAnalysisButton: vi.fn(() => {
        const btn = document.createElement('button');
        btn.id = 'webAdvisorButton';
        btn.textContent = 'Webページ分析を受ける';
        btn.setAttribute('data-action', 'openWebAdvisor');
        document.getElementById('aiActions').appendChild(btn);
      }),
      detectNoSchemaOrWebPageOnly: vi.fn(() => true),
      handleSubmit: vi.fn(function () {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
          loader.style.display = 'block';
        }
        return Promise.resolve();
      }),
    };

    global.advisorManager = mockAdvisorManager;
    global.blogReviewerManager = mockBlogReviewerManager;
    global.webAdvisorManager = mockWebAdvisorManager;
  });

  describe('JobPosting Schema - Button and Loading Display', () => {
    it('should display job advisor button when JobPosting detected', () => {
      advisorManager.showAdvisorButton();

      const btn = document.getElementById('advisorTriggerBtn');
      expect(btn).toBeTruthy();
      expect(btn.textContent).toBe('求人/求職アドバイスを受ける');
      expect(mockAdvisorManager.showAdvisorButton).toHaveBeenCalled();
    });

    it('should show loading indicator when job advisor form submitted', async () => {
      advisorManager.showAdvisorButton();
      const btn = document.getElementById('advisorTriggerBtn');

      expect(btn).toBeTruthy();

      // Simulate form submission
      await advisorManager.handleSubmit();

      const loader = document.getElementById('loadingIndicator');
      expect(loader).toBeTruthy();
      expect(loader.style.display).toBe('block');
      expect(mockAdvisorManager.handleSubmit).toHaveBeenCalled();
    });

    it('should verify button is clickable before loading starts', () => {
      advisorManager.showAdvisorButton();
      const btn = document.getElementById('advisorTriggerBtn');

      expect(btn).toBeTruthy();
      expect(btn.getAttribute('data-action')).toBe('openAdvisor');

      // Simulate click event
      const clickEvent = new MouseEvent('click', { bubbles: true });
      btn.dispatchEvent(clickEvent);

      // Button should still be present after click
      expect(document.getElementById('advisorTriggerBtn')).toBeTruthy();
    });
  });

  describe('BlogPosting Schema - Button and Loading Display', () => {
    it('should display blog reviewer button when BlogPosting detected', () => {
      blogReviewerManager.showReviewButton();

      const btn = document.getElementById('blogReviewerTriggerBtn');
      expect(btn).toBeTruthy();
      expect(btn.textContent).toBe('ブログ記事レビュー');
      expect(mockBlogReviewerManager.showReviewButton).toHaveBeenCalled();
    });

    it('should show loading indicator when blog reviewer form submitted', async () => {
      blogReviewerManager.showReviewButton();
      const btn = document.getElementById('blogReviewerTriggerBtn');

      expect(btn).toBeTruthy();

      // Simulate form submission
      await blogReviewerManager.handleSubmit();

      const loader = document.getElementById('loadingIndicator');
      expect(loader).toBeTruthy();
      expect(loader.style.display).toBe('block');
      expect(mockBlogReviewerManager.handleSubmit).toHaveBeenCalled();
    });

    it('should verify button is clickable before loading starts', () => {
      blogReviewerManager.showReviewButton();
      const btn = document.getElementById('blogReviewerTriggerBtn');

      expect(btn).toBeTruthy();
      expect(btn.getAttribute('data-action')).toBe('openBlogReviewer');

      // Simulate click event
      const clickEvent = new MouseEvent('click', { bubbles: true });
      btn.dispatchEvent(clickEvent);

      // Button should still be present after click
      expect(document.getElementById('blogReviewerTriggerBtn')).toBeTruthy();
    });
  });

  describe('WebPage Schema - Button and Loading Display', () => {
    it('should display web analysis button when no exclusive schema detected', () => {
      webAdvisorManager.showAnalysisButton();

      const btn = document.getElementById('webAdvisorButton');
      expect(btn).toBeTruthy();
      expect(btn.textContent).toBe('Webページ分析を受ける');
      expect(mockWebAdvisorManager.showAnalysisButton).toHaveBeenCalled();
    });

    it('should show loading indicator when web analysis form submitted', async () => {
      webAdvisorManager.showAnalysisButton();
      const btn = document.getElementById('webAdvisorButton');

      expect(btn).toBeTruthy();

      // Simulate form submission
      await webAdvisorManager.handleSubmit();

      const loader = document.getElementById('loadingIndicator');
      expect(loader).toBeTruthy();
      expect(loader.style.display).toBe('block');
      expect(mockWebAdvisorManager.handleSubmit).toHaveBeenCalled();
    });

    it('should verify button is clickable before loading starts', () => {
      webAdvisorManager.showAnalysisButton();
      const btn = document.getElementById('webAdvisorButton');

      expect(btn).toBeTruthy();
      expect(btn.getAttribute('data-action')).toBe('openWebAdvisor');

      // Simulate click event
      const clickEvent = new MouseEvent('click', { bubbles: true });
      btn.dispatchEvent(clickEvent);

      // Button should still be present after click
      expect(document.getElementById('webAdvisorButton')).toBeTruthy();
    });
  });

  describe('Loading State - All Advisors', () => {
    it('should initialize with loading indicator hidden', () => {
      const loader = document.getElementById('loadingIndicator');
      expect(loader).toBeTruthy();
      expect(loader.style.display).toBe('none');
    });

    it('should display loading when any advisor form is submitted', async () => {
      webAdvisorManager.showAnalysisButton();

      const loader = document.getElementById('loadingIndicator');
      expect(loader.style.display).toBe('none');

      // Simulate form submission
      await webAdvisorManager.handleSubmit();

      expect(loader.style.display).toBe('block');
    });

    it('should maintain single button display during loading', async () => {
      advisorManager.showAdvisorButton();
      await advisorManager.handleSubmit();

      const advisorBtn = document.getElementById('advisorTriggerBtn');
      const blogBtn = document.getElementById('blogReviewerTriggerBtn');
      const webBtn = document.getElementById('webAdvisorButton');
      const loader = document.getElementById('loadingIndicator');

      expect(advisorBtn).toBeTruthy();
      expect(blogBtn).toBeFalsy();
      expect(webBtn).toBeFalsy();
      expect(loader.style.display).toBe('block');
    });
  });
});
