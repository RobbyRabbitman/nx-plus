// eslint-disable-next-line @nx/enforce-module-boundaries
import { nodeTypescript } from '../vite/src/vitest-node-typescript';

export default nodeTypescript({
  test: {
    coverage: {
      enabled: false,
    },
  },
});
