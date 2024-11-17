import { nodeTypescript } from '../../tools/vite/src/vitest/vitest-node-typescript.js';

export default nodeTypescript({
  test: {
    coverage: {
      thresholds: {
        'src/get-random-port.ts': {
          branches: 80,
        },
      },
    },
  },
});
