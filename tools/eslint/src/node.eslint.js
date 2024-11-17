// @ts-check
import nodeEslint from 'eslint-plugin-n';
import ignoreEslint from './ignore.eslint.js';
import jsEslint from './js.eslint.js';
import nxEslint from './nx.eslint.js';
import tsEslint from './ts.eslint.js';

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
];

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
