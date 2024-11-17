// @ts-check
import tsEslint from 'typescript-eslint';

/** TODO: @type {import('eslint').Linter.Config[]} */
/** @type {Object[]} */
const tsEslintConfig = [
  /** https://typescript-eslint.io/getting-started */
  ...tsEslint
    .config(...tsEslint.configs.strict, ...tsEslint.configs.stylistic)
    .map((tsEslintConfig) => ({
      ...tsEslintConfig,
      files: ['**/*.ts', '**/*.mts', '**/*.cts', '**/*.tsx'],
    })),
];

export default {
  configs: {
    base: tsEslintConfig,
  },
};
