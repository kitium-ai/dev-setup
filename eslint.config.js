import baseConfig from '@kitiumai/config/eslint.config.base.js';

export default [
  ...baseConfig,
  {
    files: ['src/**/*.test.ts', 'src/__tests__/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
];
