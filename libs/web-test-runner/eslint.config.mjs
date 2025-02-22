// @ts-check
import {
  nxPlusEslintNodeConfig,
  nxPlusEslintNxDependencyChecksRuleOptions,
} from '@robby-rabbitman/nx-plus-tools-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nxPlusEslintNodeConfig,
  {
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ...nxPlusEslintNxDependencyChecksRuleOptions,
          ignoredDependencies: ['@web/test-runner'],
        },
      ],
    },
  },
];
