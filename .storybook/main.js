/**
 * Storybook メイン設定
 */

export default {
  stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx|mdx)'],

  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions', '@storybook/addon-a11y'],

  framework: {
    name: '@storybook/html-vite',
    options: {},
  },

  docs: {
    autodocs: 'tag',
  },

  core: {
    disableTelemetry: true,
  },

  viteFinal: async config => {
    return config;
  },
};
