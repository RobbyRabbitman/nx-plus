// @ts-check
import nodeEslint from './src/node.eslint.js';

/** @type {import('eslint').Linter.Config[]} */
export default [...nodeEslint.configs.all];
