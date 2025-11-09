/* @vitest-environment jsdom */
import { vi } from 'vitest';

// BaseAdvisorManagerを先にインポート
import baseMod from '../../public/modules/base-advisor.js';
const BaseAdvisorManager = baseMod.BaseAdvisorManager || baseMod.default || baseMod;

// グローバルにBaseAdvisorManagerを設定
globalThis.BaseAdvisorManager = BaseAdvisorManager;
window.BaseAdvisorManager = BaseAdvisorManager;

// グローバル関数とオブジェクトのモック
globalThis.canStartAnalysis = vi.fn(() => true);
globalThis.setAnalysisActive = vi.fn();
globalThis.setAnalysisInactive = vi.fn();
globalThis.cancelAnalysis = vi.fn();
globalThis.ADVISOR_CONST = {
  DEFAULT_MODEL: 'gpt-5-nano',
  TOKENS_PER_UNIT: 1000,
  USD_TO_JPY_RATE: 150,
  RATE_LIMIT: { NORMAL: 50 },
  ARTICLE: { MAX_BODY_LENGTH: 1000, MIN_BODY_LEN: 100 },
  USAGE_MODE: { SESSION: 'session', PERMANENT: 'permanent' },
};

globalThis.ANALYSIS_STATE = {
  activeAnalysis: null,
  abortControllers: {},
  isStreaming: false,
};

// FileParserのモック
globalThis.FileParser = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  parseFile: vi.fn(async file => ({
    text: 'parsed text',
    metadata: {
      filename: file.name,
      size: file.size,
      extension: '.txt',
    },
  })),
  isSupportedFile: vi.fn(filename => {
    const ext = filename.substring(filename.lastIndexOf('.'));
    return ['.pdf', '.csv', '.xlsx', '.xls', '.md', '.markdown', '.json', '.txt'].includes(
      ext
    );
  }),
  getSupportedExtensions: vi.fn(() => [
    '.pdf',
    '.csv',
    '.xlsx',
    '.xls',
    '.md',
    '.markdown',
    '.json',
    '.txt',
  ]),
  getFileTypeDisplayName: vi.fn(ext => {
    const map = {
      '.pdf': 'PDF',
      '.csv': 'CSV',
      '.xlsx': 'Excel',
      '.xls': 'Excel',
      '.md': 'Markdown',
      '.markdown': 'Markdown',
      '.json': 'JSON',
      '.txt': 'テキスト',
    };
    return map[ext] || 'Unknown';
  }),
};

// コンポーネントのモック
vi.mock('../../public/components/form/FileUpload.js', () => ({
  FileUpload: vi.fn(() => document.createElement('div')),
}));

vi.mock('../../public/components/common/Tabs.js', () => ({
  Tabs: vi.fn(() => document.createElement('div')),
  setActiveTab: vi.fn(),
}));

vi.mock('../../public/components/form/RadioGroup.js', () => ({
  RadioGroup: vi.fn(() => document.createElement('div')),
}));

vi.mock('../../public/components/common/Preview.js', () => ({
  Preview: vi.fn(() => document.createElement('div')),
}));

export { BaseAdvisorManager };
