import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('レスポンシブデザイン: styles.css', () => {
  const stylesContent = readFileSync(join(__dirname, '../../public/styles.css'), 'utf-8');

  it('質問者選択モーダルにグリッドレイアウトが適用されている', () => {
    expect(stylesContent).toContain('.advisor-questioner-list');
    expect(stylesContent).toContain('display: grid');
    expect(stylesContent).toContain('grid-template-columns: 1fr 1fr');
  });

  it('エージェントボタンに全幅スタイルが適用されている', () => {
    expect(stylesContent).toContain('.advisor-questioner-btn[data-questioner-id="agent"]');
    expect(stylesContent).toContain('grid-column: 1 / -1');
  });

  it('600px以下のモバイル対応メディアクエリが存在する', () => {
    expect(stylesContent).toContain('@media (max-width: 600px)');
    expect(stylesContent).toContain('grid-template-columns: 1fr');
  });

  it('モバイルメディアクエリ内で質問者リストが1カラムになる', () => {
    const mediaQueryMatch = stylesContent.match(/@media \(max-width: 600px\) \{([\s\S]*?)\}/);
    expect(mediaQueryMatch).toBeTruthy();

    if (mediaQueryMatch) {
      const mediaQueryContent = mediaQueryMatch[1];
      expect(mediaQueryContent).toContain('.advisor-questioner-list');
      expect(mediaQueryContent).toContain('grid-template-columns: 1fr');
    }
  });

  it('サンプル質問ボタンのスタイルが定義されている', () => {
    expect(stylesContent).toContain('.advisor-chat-sample-btn');
    expect(stylesContent).toContain('.advisor-chat-sample-btn:hover');
  });

  it('サンプル質問ラベルのスタイルが定義されている', () => {
    expect(stylesContent).toContain('.advisor-chat-sample-label');
  });

  it('サンプル質問コンテナのスタイルが定義されている', () => {
    expect(stylesContent).toContain('.advisor-chat-sample-questions');
  });
});

describe('レスポンシブデザイン: CSSクラスの一貫性', () => {
  const stylesContent = readFileSync(join(__dirname, '../../public/styles.css'), 'utf-8');

  it('質問者モーダル関連のクラスが全て定義されている', () => {
    const requiredClasses = [
      '.advisor-questioner-modal',
      '.advisor-questioner-modal-header',
      '.advisor-questioner-modal-body',
      '.advisor-questioner-list',
      '.advisor-questioner-btn',
      '.advisor-questioner-name',
      '.advisor-questioner-desc',
    ];

    requiredClasses.forEach(className => {
      expect(stylesContent).toContain(className);
    });
  });

  it('サンプル質問関連のクラスが全て定義されている', () => {
    const requiredClasses = [
      '.advisor-chat-sample-questions',
      '.advisor-chat-sample-label',
      '.advisor-chat-sample-btn',
    ];

    requiredClasses.forEach(className => {
      expect(stylesContent).toContain(className);
    });
  });

  it('サンプル質問ボタンにホバー効果が定義されている', () => {
    expect(stylesContent).toContain('.advisor-chat-sample-btn:hover');
    expect(stylesContent).toMatch(/\.advisor-chat-sample-btn:hover[\s\S]*?transform/);
  });

  it('サンプル質問ボタンにアクティブ効果が定義されている', () => {
    expect(stylesContent).toContain('.advisor-chat-sample-btn:active');
  });
});

describe('レスポンシブデザイン: gap とスペーシング', () => {
  const stylesContent = readFileSync(join(__dirname, '../../public/styles.css'), 'utf-8');

  it('質問者リストに適切な gap が設定されている', () => {
    const listMatch = stylesContent.match(
      /\.advisor-questioner-list\s*\{[\s\S]*?gap:\s*(\d+px)/
    );
    expect(listMatch).toBeTruthy();

    if (listMatch) {
      const gapValue = parseInt(listMatch[1]);
      expect(gapValue).toBeGreaterThanOrEqual(8);
      expect(gapValue).toBeLessThanOrEqual(20);
    }
  });

  it('サンプル質問コンテナに適切な gap が設定されている', () => {
    const sampleMatch = stylesContent.match(
      /\.advisor-chat-sample-questions\s*\{[\s\S]*?gap:\s*(\d+px)/
    );
    expect(sampleMatch).toBeTruthy();

    if (sampleMatch) {
      const gapValue = parseInt(sampleMatch[1]);
      expect(gapValue).toBeGreaterThanOrEqual(4);
      expect(gapValue).toBeLessThanOrEqual(16);
    }
  });
});

describe('レスポンシブデザイン: アニメーションとトランジション', () => {
  const stylesContent = readFileSync(join(__dirname, '../../public/styles.css'), 'utf-8');

  it('質問者ボタンにトランジションが定義されている', () => {
    const btnMatch = stylesContent.match(/\.advisor-questioner-btn\s*\{[\s\S]*?\}/);
    expect(btnMatch).toBeTruthy();

    if (btnMatch) {
      expect(btnMatch[0]).toContain('transition');
    }
  });

  it('サンプル質問ボタンにトランジションが定義されている', () => {
    const sampleBtnMatch = stylesContent.match(/\.advisor-chat-sample-btn\s*\{[\s\S]*?\}/);
    expect(sampleBtnMatch).toBeTruthy();

    if (sampleBtnMatch) {
      expect(sampleBtnMatch[0]).toContain('transition');
    }
  });

  it('サンプル質問ボタンのホバー時にtransformが適用される', () => {
    const hoverMatch = stylesContent.match(/\.advisor-chat-sample-btn:hover\s*\{[\s\S]*?\}/);
    expect(hoverMatch).toBeTruthy();

    if (hoverMatch) {
      expect(hoverMatch[0]).toContain('transform');
    }
  });
});
