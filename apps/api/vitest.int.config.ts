import { defineConfig } from 'vitest/config';
import { swcPlugin } from './vitest.config.shared';

export default defineConfig({
  plugins: [swcPlugin],
  test: {
    include: ['test/**/*.int.test.ts'],
    // Pulling and starting containers is slow on a cold machine.
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
