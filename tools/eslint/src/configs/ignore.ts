import { type Linter } from 'eslint';

/** The files of `Nx Plus` that ESLint should ignore. */
export const nxPlusEslintIgnoreConfig = [
  {
    ignores: [
      'dist/',
      'build/',
      'node_modules/',
      'tmp/',
      '.storage/',
      'coverage/',
      '**/*.timestamp-*',
    ],
  },
] satisfies Linter.Config[];

export default nxPlusEslintIgnoreConfig;
