// @ts-check
import nodeEslint from '../eslint/src/node.eslint.js';

/** @type {import('eslint').Linter.Config[]} */
export default [...nodeEslint.configs.all];
