// @ts-check
const baseConfig = require('../../tools/eslint/src/base.config');

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
            '@robby-rabbitman/nx-plus-tools-vite',
          ],
        },
      ],
    },
  },
];
