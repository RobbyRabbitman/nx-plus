// @ts-check
const { FlatCompat } = require('@eslint/eslintrc');
const nxPlugin = require('@nx/eslint-plugin');
const js = require('@eslint/js');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  { plugins: { '@nx': nxPlugin } },
  ...compat.config({ extends: ['plugin:@nx/javascript'] }).map((config) => ({
    ...config,
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    rules: {
      ...config.rules,
    },
  })),
];
