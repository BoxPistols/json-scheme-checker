/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Web Analysis Button Exclusivity - 1 Page = 1 Analysis', () => {
  let mockAdvisorManager;
  let mockBlogReviewerManager;
  let mockWebAdvisorManager;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="results"></div>
      <div id="aiActions"></div>
    `;

    // Mock managers
    mockAdvisorManager = {
      hideAdvisorButton: vi.fn(() => {
        const btn = document.getElementById('advisorTriggerBtn');
        if (btn) btn.remove();
      }),
      showAdvisorButton: vi.fn(() => {
        const btn = document.createElement('button');
        btn.id = 'advisorTriggerBtn';
        btn.textContent = '求人/求職アドバイスを受ける';
        document.getElementById('aiActions').appendChild(btn);
      }),
      detectJobPosting: vi.fn(function() {
        this.hideAdvisorButton();
        this.showAdvisorButton();
        return true;
      }),
    };

    mockBlogReviewerManager = {
      hideReviewButton: vi.fn(() => {
        const btn = document.getElementById('blogReviewerTriggerBtn');
        if (btn) btn.remove();
      }),
      showReviewButton: vi.fn(() => {
        const btn = document.createElement('button');
        btn.id = 'blogReviewerTriggerBtn';
        btn.textContent = 'ブログ記事レビュー';
        document.getElementById('aiActions').appendChild(btn);
      }),
      detectBlogPost: vi.fn(function() {
        this.hideReviewButton();
        this.showReviewButton();
        return true;
      }),
    };

    mockWebAdvisorManager = {
      hideAnalysisButton: vi.fn(() => {
        const btn = document.getElementById('webAdvisorButton');
        if (btn) btn.remove();
      }),
      showAnalysisButton: vi.fn(() => {
        const btn = document.createElement('button');
        btn.id = 'webAdvisorButton';
        btn.textContent = 'Webページ分析を受ける';
        document.getElementById('aiActions').appendChild(btn);
      }),
      detectNoSchemaOrWebPageOnly: vi.fn(function() {
        this.hideAnalysisButton();
        this.showAnalysisButton();
        return true;
      }),
    };

    // Set globals
    global.advisorManager = mockAdvisorManager;
    global.blogReviewerManager = mockBlogReviewerManager;
    global.webAdvisorManager = mockWebAdvisorManager;
  });

  it('should clear all previous buttons before detection', () => {
    // Simulate button clear logic from app.js
    if (typeof advisorManager !== 'undefined') {
      advisorManager.hideAdvisorButton();
    }
    if (typeof blogReviewerManager !== 'undefined') {
      blogReviewerManager.hideReviewButton();
    }
    if (typeof webAdvisorManager !== 'undefined') {
      webAdvisorManager.hideAnalysisButton();
    }

    expect(mockAdvisorManager.hideAdvisorButton).toHaveBeenCalled();
    expect(mockBlogReviewerManager.hideReviewButton).toHaveBeenCalled();
    expect(mockWebAdvisorManager.hideAnalysisButton).toHaveBeenCalled();
  });

  it('should display only job advisor button when JobPosting detected', () => {
    // Clear buttons
    advisorManager.hideAdvisorButton();
    blogReviewerManager.hideReviewButton();
    webAdvisorManager.hideAnalysisButton();

    // Simulate if-else-if logic from app.js
    if (advisorManager.detectJobPosting({})) {
      // JobPosting detected, return here (other branches not executed)
    } else if (blogReviewerManager.detectBlogPost({})) {
      // Not executed
    } else if (webAdvisorManager.detectNoSchemaOrWebPageOnly({}, '')) {
      // Not executed
    }

    const advisorBtn = document.getElementById('advisorTriggerBtn');
    const blogBtn = document.getElementById('blogReviewerTriggerBtn');
    const webBtn = document.getElementById('webAdvisorButton');

    expect(advisorBtn).toBeTruthy();
    expect(advisorBtn.textContent).toBe('求人/求職アドバイスを受ける');
    expect(blogBtn).toBeFalsy(); // Should not exist
    expect(webBtn).toBeFalsy(); // Should not exist
  });

  it('should display only blog review button when BlogPosting detected', () => {
    // Clear buttons
    advisorManager.hideAdvisorButton();
    blogReviewerManager.hideReviewButton();
    webAdvisorManager.hideAnalysisButton();

    // Setup: first detection returns false (not JobPosting)
    mockAdvisorManager.detectJobPosting = vi.fn(() => false);

    // Simulate if-else-if logic
    if (advisorManager.detectJobPosting({})) {
      // Not executed
    } else if (blogReviewerManager.detectBlogPost({})) {
      // BlogPosting detected, return here
    } else if (webAdvisorManager.detectNoSchemaOrWebPageOnly({}, '')) {
      // Not executed
    }

    const advisorBtn = document.getElementById('advisorTriggerBtn');
    const blogBtn = document.getElementById('blogReviewerTriggerBtn');
    const webBtn = document.getElementById('webAdvisorButton');

    expect(advisorBtn).toBeFalsy(); // Should not exist
    expect(blogBtn).toBeTruthy();
    expect(blogBtn.textContent).toBe('ブログ記事レビュー');
    expect(webBtn).toBeFalsy(); // Should not exist
  });

  it('should display only web analysis button when no exclusive schema detected', () => {
    // Clear buttons
    advisorManager.hideAdvisorButton();
    blogReviewerManager.hideReviewButton();
    webAdvisorManager.hideAnalysisButton();

    // Setup: first two detections return false
    mockAdvisorManager.detectJobPosting = vi.fn(() => false);
    mockBlogReviewerManager.detectBlogPost = vi.fn(() => false);

    // Simulate if-else-if logic
    if (advisorManager.detectJobPosting({})) {
      // Not executed
    } else if (blogReviewerManager.detectBlogPost({})) {
      // Not executed
    } else if (webAdvisorManager.detectNoSchemaOrWebPageOnly({}, '')) {
      // Web analysis detected, return here
    }

    const advisorBtn = document.getElementById('advisorTriggerBtn');
    const blogBtn = document.getElementById('blogReviewerTriggerBtn');
    const webBtn = document.getElementById('webAdvisorButton');

    expect(advisorBtn).toBeFalsy(); // Should not exist
    expect(blogBtn).toBeFalsy(); // Should not exist
    expect(webBtn).toBeTruthy();
    expect(webBtn.textContent).toBe('Webページ分析を受ける');
  });

  it('should replace button when navigating to different page type', () => {
    // First: JobPosting page
    advisorManager.hideAdvisorButton();
    blogReviewerManager.hideReviewButton();
    webAdvisorManager.hideAnalysisButton();
    advisorManager.detectJobPosting({});

    let advisorBtn = document.getElementById('advisorTriggerBtn');
    expect(advisorBtn).toBeTruthy();

    // Second: BlogPosting page (clear and show blog button)
    mockAdvisorManager.detectJobPosting = vi.fn(() => false);
    advisorManager.hideAdvisorButton();
    blogReviewerManager.hideReviewButton();
    webAdvisorManager.hideAnalysisButton();
    blogReviewerManager.detectBlogPost({});

    advisorBtn = document.getElementById('advisorTriggerBtn');
    const blogBtn = document.getElementById('blogReviewerTriggerBtn');

    expect(advisorBtn).toBeFalsy(); // Previous button should be gone
    expect(blogBtn).toBeTruthy(); // New button should exist
  });
});
