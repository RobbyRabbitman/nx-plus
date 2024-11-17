import { nodeEslint } from './src/index.js';

/** @type {import('eslint').Linter.Config[]} */
export default [...nodeEslint.configs.all];
