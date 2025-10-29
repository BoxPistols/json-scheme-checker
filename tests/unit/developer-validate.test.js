/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import mod from '../../public/modules/base-advisor.js';
const BaseAdvisorManager = mod.BaseAdvisorManager || mod.default || mod;

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
      <div id="developerApiStatus"><span class="advisor-status-chip"></span><span class="advisor-status-chip"></span></div>
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

  it('saves valid values into localStorage', () => {
    document.getElementById('developerApiKeyInput').value = 'sk-abc';
    document.getElementById('developerApiProviderInput').value = 'openai';
    document.getElementById('developerApiBaseUrlInput').value = 'https://api.openai.com/v1';
    document.getElementById('developerApiModelInput').value = 'gpt-4o-mini';
    // confirmが不要なケース
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    mgr.saveDeveloperKey();
    confirmSpy.mockRestore();
    expect(localStorage.getItem('jsonld_user_openai_key')).toBe('sk-abc');
    expect(localStorage.getItem('jsonld_user_api_provider')).toBe('openai');
    expect(localStorage.getItem('jsonld_user_api_base_url')).toBe('https://api.openai.com/v1');
    expect(localStorage.getItem('jsonld_user_api_model')).toBe('gpt-4o-mini');
  });

  it('resetDeveloperSettings clears values when confirmed', () => {
    localStorage.setItem('jsonld_user_openai_key', 'sk-abc');
    localStorage.setItem('jsonld_user_api_provider', 'openai');
    localStorage.setItem('jsonld_user_api_base_url', 'https://api.openai.com/v1');
    localStorage.setItem('jsonld_user_api_model', 'gpt-4o-mini');
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    mgr.resetDeveloperSettings();
    // saveUserApiKey('') は removeItem を行う実装
    expect(localStorage.getItem('jsonld_user_openai_key')).toBeNull();
    expect(localStorage.getItem('jsonld_user_api_provider')).toBe('');
    expect(localStorage.getItem('jsonld_user_api_base_url')).toBe('');
    expect(localStorage.getItem('jsonld_user_api_model')).toBe('');
    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });
});
