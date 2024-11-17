/** @type {import('eslint').Linter.Config[]} */
const ignoreEslintConfig = [
  {
    ignores: [
      'dist',
      'build',
      'node_modules',
      'tmp',
      'storage',
      'coverage',
      '**/*.timestamp-*',
    ],
  },
];

export default {
  configs: {
    base: ignoreEslintConfig,
  },
};
