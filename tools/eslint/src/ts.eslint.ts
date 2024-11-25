import type { Linter } from 'eslint';
import tsEslint from 'typescript-eslint';

const tsEslintConfig = [
  /** https://typescript-eslint.io/getting-started */
  ...tsEslint
    .config(...tsEslint.configs.strict, ...tsEslint.configs.stylistic)
    .map((tsEslintConfig) => ({
      ...tsEslintConfig,
      files: ['**/*.ts', '**/*.mts', '**/*.cts', '**/*.tsx'],
    })),
] as Linter.Config[]; // TODO: types are wrong

export default {
  configs: {
    base: tsEslintConfig,
  },
};
