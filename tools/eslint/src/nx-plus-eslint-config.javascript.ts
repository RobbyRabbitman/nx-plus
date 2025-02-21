import eslintJs from '@eslint/js';
import { type Linter } from 'eslint';
import eslintPrettierConfig from 'eslint-config-prettier';
import nxPlusEslintIgnoreConfig from './nx-plus-eslint-config.ignore.js';

/** The ESLint configuration for JavaScript files of `Nx Plus`. */
export const nxPlusEslintJsConfig = [
  ...nxPlusEslintIgnoreConfig,

  /** https://eslint.org/docs/latest/use/getting-started */
  {
    ...eslintJs.configs.recommended,
    files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.jsx'],
  },
  eslintPrettierConfig,
] satisfies Linter.Config[];

export default nxPlusEslintJsConfig;
