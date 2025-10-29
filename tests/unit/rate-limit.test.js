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
  isStakeholderMode() { return this._stakeholder; }
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
});
