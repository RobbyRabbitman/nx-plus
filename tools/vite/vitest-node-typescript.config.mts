import { nodeTypescript } from './src/vitest-node-typescript';

export default nodeTypescript({
  test: {
    coverage: { enabled: false },
    include: ['src/vitest-node-typescript.spec.ts'],
  },
});
