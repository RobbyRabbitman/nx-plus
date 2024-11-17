// @ts-check
import jsEslint from '@eslint/js';
import prettierEslintConfig from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
const jsEslintConfig = [
  /** https://eslint.org/docs/latest/use/getting-started */
  {
    ...jsEslint.configs.recommended,
    files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.jsx'],
  },
  prettierEslintConfig,
];

export default {
  configs: {
    base: jsEslintConfig,
  },
};
