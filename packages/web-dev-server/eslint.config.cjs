// @ts-check
const baseConfig = require('../../tools/eslint/src/base.config');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredDependencies: [
            'memfs',
            'minimatch',
            'vitest',
            'nx',
            '@robby-rabbitman/nx-plus-tools-vite',
          ],
        },
      ],
    },
  },
];
