import type { Linter } from 'eslint';

const ignoreEslintConfig = [
  {
    ignores: [
      'dist/',
      'build/',
      'node_modules/',
      'tmp/',
      '.storage/',
      '.logs/',
      'coverage/',
      'e2e-nx-workspaces/',
      '**/*.timestamp-*',
    ],
  },
] satisfies Linter.Config[];

export default {
  configs: {
    base: ignoreEslintConfig,
  },
};
