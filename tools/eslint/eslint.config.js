// eslint-disable-next-line @nx/enforce-module-boundaries
import { nodeEslint } from '@robby-rabbitman/nx-plus-tools-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [...nodeEslint.configs.all];
