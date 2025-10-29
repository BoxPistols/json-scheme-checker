/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mod from '../../public/modules/base-advisor.js';
const BaseAdvisorManager = mod.BaseAdvisorManager || mod.default || mod;

class DevManager extends BaseAdvisorManager {
  constructor() {
    super({ elemIdPrefix: 'dev', USER_API_KEY: 'jsonld_user_openai_key' });
  }
}

describe('Developer connection flow', () => {
  let mgr;
  let originalFetch;
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="developerApiKeyInput" value="">
      <input id="developerApiProviderInput" value="openai">
      <input id="developerApiBaseUrlInput" value="">
      <input id="developerApiModelInput" value="gpt-4o-mini">
      <div id="developerApiStatus"><span class="advisor-status-chip"></span><span class="advisor-status-chip"></span></div>
    `;
    mgr = new DevManager();
    originalFetch = global.fetch;
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('alerts when API key is empty and does not call fetch', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    global.fetch = vi.fn();
    await mgr.testDeveloperConnection();
    expect(alertSpy).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('calls local test-connection endpoint with provided fields', async () => {
    // set key
    document.getElementById('developerApiKeyInput').value = 'sk-test';
    const json = vi.fn().mockResolvedValue({ ok: true, provider: 'openai', model: 'gpt-4o-mini' });
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json });

    await mgr.testDeveloperConnection();

    expect(global.fetch).toHaveBeenCalled();
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('http://127.0.0.1:3333/api/test-connection');
    const body = JSON.parse(opts.body);
    expect(body.userApiKey).toBe('sk-test');
    expect(body.model).toBe('gpt-4o-mini');
  });
});
