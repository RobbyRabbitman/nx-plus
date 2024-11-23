import jsEslint from '@eslint/js';
import type { Linter } from 'eslint';
import prettierEslintConfig from 'eslint-config-prettier';

const jsEslintConfig = [
  /** https://eslint.org/docs/latest/use/getting-started */
  {
    ...jsEslint.configs.recommended,
    files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.jsx'],
  },
  prettierEslintConfig,
] satisfies Linter.Config[];

export default {
  configs: {
    base: jsEslintConfig,
  },
};
