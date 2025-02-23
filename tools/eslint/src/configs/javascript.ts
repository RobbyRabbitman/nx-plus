import jsEslint from '@eslint/js';
import { type Linter } from 'eslint';
import prettierEslintConfig from 'eslint-config-prettier';
import nxPlusEslintIgnoreConfig from './ignore.js';

/** The ESLint configuration for JavaScript files of `Nx Plus`. */
export const nxPlusEslintJsConfig = [
  ...nxPlusEslintIgnoreConfig,

  /** https://eslint.org/docs/latest/use/getting-started */
  {
    ...jsEslint.configs.recommended,
    files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.jsx'],
  },
  prettierEslintConfig,
] satisfies Linter.Config[];

export default nxPlusEslintJsConfig;
