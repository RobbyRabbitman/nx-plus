import { type Linter } from 'eslint';
import eslintNode from 'eslint-plugin-n';
import nxPlusEslintIgnoreConfig from './nx-plus-eslint-config.ignore.js';
import nxPlusEslintJsConfig from './nx-plus-eslint-config.javascript.js';
import nxPlusEslintNxConfig from './nx-plus-eslint-config.nx.js';
import nxPlusEslintTsConfig from './nx-plus-eslint-config.typescript.js';

const eslintNodeRecommendedConfig =
  eslintNode.configs['flat/recommended-module'];

/**
 * The ESLint configuration for JavaScript files of `Nx Plus` that are expected
 * to run in Node.js.
 */
export const nxPlusEslintNodeConfig = [
  ...nxPlusEslintIgnoreConfig,
  ...nxPlusEslintJsConfig,
  ...nxPlusEslintTsConfig,
  ...nxPlusEslintNxConfig,

  /** https://github.com/eslint-community/eslint-plugin-n */
  {
    ...eslintNodeRecommendedConfig,
    files: [
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs',
      '**/*.ts',
      '**/*.mts',
      '**/*.cts',
    ],
    rules: {
      ...eslintNodeRecommendedConfig.rules,
      /** @nx/dependency-checks is handling the dependency checks */
      'n/no-missing-import': 'off',
      'n/no-extraneous-import': 'off',

      'n/no-process-exit': 'off',
    },
  },
] satisfies Linter.Config[];

export default nxPlusEslintNodeConfig;
