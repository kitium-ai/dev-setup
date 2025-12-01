import baseConfig from '@kitiumai/config/vitest.config.base.js';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'src/__tests__/utils.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src'],
      exclude: ['**/*.test.ts', 'src/__tests__/**'],
    },
  },
});
