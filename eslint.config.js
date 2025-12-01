import baseConfig from '@kitiumai/config/eslint.config.base.js';

export default [
  ...baseConfig,
  {
    ignores: [
      '**/*.cjs',
      'bin/**',
      'dist/**',
      'node_modules/**',
      '*.config.js',
      '*.config.ts',
    ],
  },
  {
    files: ['src/**/*.test.ts', 'src/__tests__/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
];
