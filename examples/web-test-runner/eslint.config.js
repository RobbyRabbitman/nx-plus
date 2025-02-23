// @ts-check
import { nxPlusEslintJsConfig } from '@robby-rabbitman/nx-plus-tools-eslint';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nxPlusEslintJsConfig,
  {
    files: ['src/**/*.spec.js'],
    languageOptions: {
      globals: globals.mocha,
    },
  },
];
