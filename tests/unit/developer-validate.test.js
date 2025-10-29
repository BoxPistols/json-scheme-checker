/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseAdvisorManager } from '../../public/modules/base-advisor.js';

class DummyManager extends BaseAdvisorManager {
  constructor() {
    super({ elemIdPrefix: 'dev', ui: { showConfirmDialog: () => {} } });
  }
}

describe('Developer modal validations', () => {
  let mgr;
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <input id="developerApiKeyInput" value="">
      <input id="developerApiProviderInput" value=" ">
      <input id="developerApiBaseUrlInput" value="http:// ">
      <input id="developerApiModelInput" value="">
    `;
    mgr = new DummyManager();
  });

  it('prevents saving whitespace-only values', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    mgr.saveDeveloperKey();
    expect(alertSpy).toHaveBeenCalled();
    expect(localStorage.getItem('jsonld_user_openai_key')).toBeNull();
    alertSpy.mockRestore();
  });
});
