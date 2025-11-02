/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import mod from '../../public/modules/base-advisor.js';
const BaseAdvisorManager = mod.BaseAdvisorManager || mod.default || mod;

class RLManager extends BaseAdvisorManager {
  constructor(stakeholder = false) {
    super({
      elemIdPrefix: 'rl',
      RATE_LIMIT_KEY: 'jsonld_rl_usage',
      USER_API_KEY: 'jsonld_user_openai_key',
      MAX_REQUESTS_PER_DAY: 2,
      MAX_REQUESTS_STAKEHOLDER: 3,
    });
    this._stakeholder = stakeholder;
  }
  isStakeholderMode() {
    return this._stakeholder;
  }
}

describe('Rate limit logic', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('enforces MAX_REQUESTS_PER_DAY when not stakeholder and no user key', () => {
    const mgr = new RLManager(false);
    let rl = mgr.checkRateLimit();
    expect(rl.allowed).toBe(true);
    mgr.recordUsage();
    mgr.recordUsage();
    rl = mgr.checkRateLimit();
    expect(rl.allowed).toBe(false);
    expect(rl.remaining).toBe(0);
    // 実装ではDateオブジェクトを返すためDate/文字列/nullのいずれかを許容
    expect(
      rl.resetTime === null || rl.resetTime instanceof Date || typeof rl.resetTime === 'string'
    ).toBe(true);
  });

  it('uses stakeholder limit when stakeholder mode', () => {
    const mgr = new RLManager(true);
    mgr.recordUsage();
    mgr.recordUsage();
    let rl = mgr.checkRateLimit();
    expect(rl.allowed).toBe(true);
  });

  it('does not record usage when user key exists (developer mode)', () => {
    localStorage.setItem('jsonld_user_openai_key', 'sk-test');
    const mgr = new RLManager(false);
    mgr.recordUsage();
    const data = JSON.parse(localStorage.getItem('jsonld_rl_usage') || '[]');
    expect(data.length).toBe(0);
  });

  it('ignores stale usage entries older than 24h', () => {
    const key = 'jsonld_rl_usage';
    const now = Date.now();
    const oldTs = now - 25 * 60 * 60 * 1000;
    localStorage.setItem(key, JSON.stringify([oldTs]));
    const mgr = new RLManager(false);
    const rl = mgr.checkRateLimit();
    expect(rl.allowed).toBe(true);
    expect(rl.remaining).toBeGreaterThan(0);
  });

  it('returns usingUserKey true and developer mode when user key exists', () => {
    localStorage.setItem('jsonld_user_openai_key', 'sk-dev');
    const mgr = new RLManager(false);
    const rl = mgr.checkRateLimit();
    expect(rl.usingUserKey).toBe(true);
    expect(rl.mode).toBe('developer');
  });
});
