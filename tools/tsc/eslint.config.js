// @ts-check
const baseConfig = require('../eslint/src/base.config');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...baseConfig,
  {
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredDependencies: [
            'vitest',
            'memfs',
            'minimatch',
            '@robby-rabbitman/nx-plus-tools-vite',
          ],
        },
      ],
    },
  },
];
