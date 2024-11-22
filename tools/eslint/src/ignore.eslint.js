/** @type {import('eslint').Linter.Config[]} */
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
];

export default {
  configs: {
    base: ignoreEslintConfig,
  },
};
