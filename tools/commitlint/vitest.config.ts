import { nodeTypescript } from '@robby-rabbitman/nx-plus-tools-vite';

export default nodeTypescript({
  test: {
    coverage: {
      enabled: false,
    },
  },
});
