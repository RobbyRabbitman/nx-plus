import { nodeTypescript } from '../vite/src/vitest/vitest-node-typescript.js';

export default nodeTypescript({
  test: {
    coverage: {
      enabled: false,
    },
  },
});
