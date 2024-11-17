// @ts-check
import nodeEslint from 'eslint-plugin-n';
import { nxEslint } from '.';
import ignoreEslint from './ignore.eslint';
import jsEslint from './js.eslint';
import tsEslint from './ts.eslint';

const nodeEslintConfigRecomended =
  nodeEslint.configs['flat/recommended-module'];

/** @type {import('eslint').Linter.Config[]} */
const nodeEslintConfig = [
  /** https://github.com/eslint-community/eslint-plugin-n */
  {
    ...nodeEslintConfigRecomended,
    files: [
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs',
      '**/*.ts',
      '**/*.mts',
      '**/*.cts',
    ],
  },
  {
    /** TODO: remove me when projects dont use relative imports */
    files: ['**/eslint.config.*'],
    rules: {
      'n/no-unpublished-import': 'off',
    },
  },
];

export default {
  configs: {
    base: nodeEslintConfig,
    all: [
      ...ignoreEslint.configs.base,
      ...jsEslint.configs.base,
      ...tsEslint.configs.base,
      ...nxEslint.configs.base,
      ...nodeEslintConfig,
    ],
  },
};
