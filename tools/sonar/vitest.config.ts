import { nodeTypescript } from '@robby-rabbitman/nx-plus-tools-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  nodeTypescript(),
  defineConfig({
    test: {
      coverage: {
        exclude: ['src/api/sonar-api.ts'],
      },
    },
  }),
);
