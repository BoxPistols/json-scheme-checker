/**
 * Storybook プレビュー設定
 */

// グローバルCSSをインポート
import '../public/styles/main.css';

// プレビュー設定
export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  backgrounds: {
    default: 'light',
    values: [
      {
        name: 'light',
        value: '#f5f7fa',
      },
      {
        name: 'dark',
        value: '#111827',
      },
      {
        name: 'white',
        value: '#ffffff',
      },
    ],
  },
  viewport: {
    viewports: {
      mobile: {
        name: 'Mobile',
        styles: {
          width: '375px',
          height: '667px',
        },
      },
      tablet: {
        name: 'Tablet',
        styles: {
          width: '768px',
          height: '1024px',
        },
      },
      desktop: {
        name: 'Desktop',
        styles: {
          width: '1440px',
          height: '900px',
        },
      },
    },
  },
};

// グローバルデコレータ
export const decorators = [
  (Story) => {
    const wrapper = document.createElement('div');
    wrapper.style.padding = '20px';
    wrapper.style.minHeight = '100px';

    const story = Story();
    wrapper.appendChild(story);

    return wrapper;
  },
];
