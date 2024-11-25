import type { Linter } from 'eslint';
import nodeEslint from 'eslint-plugin-n';
import ignoreEslint from './ignore.eslint.js';
import jsEslint from './js.eslint.js';
import nxEslint from './nx.eslint.js';
import tsEslint from './ts.eslint.js';

const nodeEslintConfigRecomended =
  nodeEslint.configs['flat/recommended-module'];

const nodeEslintConfig = [
  /** https://github.com/eslint-community/eslint-plugin-n */
  {
    ...nodeEslintConfigRecomended,
    settings: {
      ...nodeEslintConfigRecomended.settings,
      node: {
        /** TODO: add renovate syntax here so this value gets renovated aswell */
        version: '>=20.18.0',
      },
    },
    files: [
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs',
      '**/*.ts',
      '**/*.mts',
      '**/*.cts',
    ],
    rules: {
      ...nodeEslintConfigRecomended.rules,
      /** @nx/dependency-checks is handling the dependency checks */
      'n/no-missing-import': 'off',
      'n/no-extraneous-import': 'off',
      'n/no-process-exit': 'off',
    },
  },
] satisfies Linter.Config[];

export default {
  configs: {
    base: nodeEslintConfig,
    all: [
      ...jsEslint.configs.base,
      ...tsEslint.configs.base,
      ...nxEslint.configs.base,
      ...nodeEslintConfig,
      ...ignoreEslint.configs.base,
    ],
  },
};
