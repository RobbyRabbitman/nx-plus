// eslint-disable-next-line @nx/enforce-module-boundaries
import { nodeTypescript } from '../../tools/vite/src/vitest-node-typescript';

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
