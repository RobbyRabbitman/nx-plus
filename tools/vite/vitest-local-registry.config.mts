import { mergeConfig } from 'vitest/config';
import { localRegistry } from './src/vitest-local-registry';
import { nodeTypescript } from './src/vitest-node-typescript';

export default mergeConfig(
  nodeTypescript({
    test: {
      coverage: { enabled: false },
      include: ['src/vitest-local-registry.spec.ts'],
    },
  }),
  localRegistry(),
);
