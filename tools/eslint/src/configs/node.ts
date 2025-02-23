import { type Linter } from 'eslint';
import nodeEslint from 'eslint-plugin-n';
import globals from 'globals';
// eslint-disable-next-line @nx/enforce-module-boundaries
import nxPlusPackageJson from '../../../../package.json' with { type: 'json' };
import nxPlusEslintIgnoreConfig from './ignore.js';
import nxPlusEslintJsConfig from './javascript.js';
import nxPlusEslintNxConfig from './nx.js';
import nxPlusEslintTsConfig from './typescript.js';

const eslintNodeRecommendedConfig =
  nodeEslint.configs['flat/recommended-module'];

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
    languageOptions: {
      globals: globals.node,
    },
    settings: {
      ...eslintNodeRecommendedConfig.settings,
      node: {
        version: nxPlusPackageJson.engines.node,
      },
    },
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
