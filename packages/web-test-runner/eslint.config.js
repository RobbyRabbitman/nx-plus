import { nodeEslint } from '@robby-rabbitman/nx-plus-tools-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nodeEslint.configs.all,
  {
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          /**
           * TODO: why are wild cards needed? The config files are in the root
           * of the project.
           */
          ignoredFiles: [
            '**/eslint.config.js',
            '**/vitest.config.ts',
            '**/*.spec.ts',
          ],
        },
      ],
    },
  },
];
