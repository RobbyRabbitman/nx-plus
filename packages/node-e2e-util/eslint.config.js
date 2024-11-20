import { nodeEslint } from '@robby-rabbitman/nx-plus-tools-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nodeEslint.configs.all,
  {
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          /** TODO: why is not found? find out how the rule resolves deps */
          ignoredDependencies: ['@robby-rabbitman/nx-plus-node-util'],
        },
      ],
    },
  },
];
