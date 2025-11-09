/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';

// 共通セットアップをインポート
import '../setup/content-upload-reviewer-setup.js';

// Content Upload Reviewerをインポート
import mod from '../../public/modules/content-upload-reviewer.js';
const ContentUploadReviewerManager =
  mod.ContentUploadReviewerManager || mod.default || mod;

describe('Content Upload Reviewer - Rate Limit', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('無料プランでは50回/24時間の制限がある', () => {
    const manager = new ContentUploadReviewerManager();

    // 最初は利用可能
    let rateLimit = manager.checkRateLimit();
    expect(rateLimit.allowed).toBe(true);
    expect(rateLimit.remaining).toBe(50);
    expect(rateLimit.usingUserKey).toBe(false);
    expect(rateLimit.mode).toBe('free');

    // 50回使用
    for (let i = 0; i < 50; i++) {
      manager.recordUsage();
    }

    // 制限に達する
    rateLimit = manager.checkRateLimit();
    expect(rateLimit.allowed).toBe(false);
    expect(rateLimit.remaining).toBe(0);
    expect(rateLimit.resetTime).toBeTruthy();
  });

  it('ユーザーAPIキー使用時は無制限', () => {
    const manager = new ContentUploadReviewerManager();

    // APIキーを設定
    localStorage.setItem('jsonld_content_upload_reviewer_openai_key', 'sk-test-key');

    const rateLimit = manager.checkRateLimit();
    expect(rateLimit.allowed).toBe(true);
    expect(rateLimit.remaining).toBe(Infinity);
    expect(rateLimit.usingUserKey).toBe(true);
    expect(rateLimit.mode).toBe('developer');

    // 使用記録は残らない
    manager.recordUsage();
    const usage = JSON.parse(
      localStorage.getItem('jsonld_content_upload_reviewer_usage') || '[]'
    );
    expect(usage.length).toBe(0);
  });

  it('24時間経過後にリセットされる', () => {
    const manager = new ContentUploadReviewerManager();

    // 25時間前のタイムスタンプを設定
    const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000;
    localStorage.setItem(
      'jsonld_content_upload_reviewer_usage',
      JSON.stringify([oldTimestamp])
    );

    const rateLimit = manager.checkRateLimit();
    expect(rateLimit.allowed).toBe(true);
    expect(rateLimit.remaining).toBe(50);
  });

  it('複数のタイムスタンプのうち24時間以内のもののみカウント', () => {
    const manager = new ContentUploadReviewerManager();

    const now = Date.now();
    const oldTimestamp = now - 25 * 60 * 60 * 1000; // 25時間前
    const recentTimestamp = now - 1 * 60 * 60 * 1000; // 1時間前

    localStorage.setItem(
      'jsonld_content_upload_reviewer_usage',
      JSON.stringify([oldTimestamp, recentTimestamp, recentTimestamp])
    );

    const rateLimit = manager.checkRateLimit();
    expect(rateLimit.allowed).toBe(true);
    expect(rateLimit.remaining).toBe(48); // 50 - 2 = 48
  });

  it('MAX_REQUESTS_PER_DAYが正しく設定されている', () => {
    const manager = new ContentUploadReviewerManager();
    expect(manager.config.MAX_REQUESTS_PER_DAY).toBe(50);
  });
});
