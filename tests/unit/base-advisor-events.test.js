/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseAdvisorManager } from '../../public/modules/base-advisor.js';

class TestManager extends BaseAdvisorManager {
  constructor() {
    super({ elemIdPrefix: 'test', actionHandlers: { 'test-action': () => this.onTest() } });
    this.called = false;
  }
  onTest() { this.called = true; }
}

describe('BaseAdvisorManager click dispatch', () => {
  let mgr;
  beforeEach(() => {
    document.body.innerHTML = '';
    mgr = new TestManager();
  });

  it('dispatches handler when button[data-action] clicked', () => {
    const btn = document.createElement('button');
    btn.dataset.action = 'test-action';
    document.body.appendChild(btn);
    btn.click();
    expect(mgr.called).toBe(true);
  });

  it('ignores unknown actions', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const btn = document.createElement('button');
    btn.dataset.action = 'unknown-action';
    document.body.appendChild(btn);
    btn.click();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
