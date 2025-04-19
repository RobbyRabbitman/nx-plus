import { nodeTypescript } from '@robby-rabbitman/nx-plus-tools-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  nodeTypescript(),
  defineConfig({
    test: {
      coverage: {
        thresholds: {
          lines: 80,
          statements: 80,
          branches: 80,
        },
      },
    },
  }),
);
