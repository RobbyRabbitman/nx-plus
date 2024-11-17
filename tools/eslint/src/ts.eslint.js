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
      rules: {
        ...tsEslintConfig.rules,
        /** TODO: https://github.com/eslint/eslint/issues/19134 */
        '@typescript-eslint/no-unused-expressions': [
          'error',
          {
            allowShortCircuit: true,
            allowTernary: true,
          },
        ],
        '@typescript-eslint/dot-notation': ['error', { allowKeywords: true }],
        '@typescript-eslint/no-empty-function': [
          'error',
          { allow: ['arrowFunctions'] },
        ],
      },
    })),
];

export default {
  configs: {
    base: tsEslintConfig,
  },
};
