import jsEslint from '@eslint/js';
import type { Linter } from 'eslint';
import * as prettierEslintConfig from 'eslint-config-prettier';

const jsEslintConfig = [
  /** https://eslint.org/docs/latest/use/getting-started */
  {
    ...jsEslint.configs.recommended,
    files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.jsx'],
  },
  {
    rules: prettierEslintConfig.rules,
  },
] satisfies Linter.Config[];

export default {
  configs: {
    base: jsEslintConfig,
  },
};
