import { defineConfig } from 'vitest/config';
import { swcPlugin } from './vitest.config.shared';

export default defineConfig({
  plugins: [swcPlugin],
  test: { include: ['test/**/*.e2e.test.ts'] },
});
