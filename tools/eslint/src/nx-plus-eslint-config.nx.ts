import eslintNxPlugin from '@nx/eslint-plugin';
import { type Linter } from 'eslint';
import eslintJsoncParser from 'jsonc-eslint-parser';
import eslintTs from 'typescript-eslint';
import nxPlusEslintIgnoreConfig from './nx-plus-eslint-config.ignore.js';

const nxDependencyChecksRuleOptions = {
  ignoredFiles: ['**/{*.config.*,*.spec.*,test-setup.*}'],
  buildTargets: ['eslint-nx-dependency-checks-pseudo-build'],
};

export const nxPlusEslintNxConfig = [
  ...nxPlusEslintIgnoreConfig,
  { plugins: { '@nx': eslintNxPlugin } },
  // https://nx.dev/nx-api/eslint-plugin#dependency-checks-rule
  {
    files: ['**/*.json'],
    languageOptions: {
      parser: eslintJsoncParser,
    },
    rules: {
      '@nx/dependency-checks': [
        /**
         * TODO: Apparently this rule does not seem to work when 1. not every
         * project has been build and 2. the workspace has been reset via 'nx
         * reset' - https://github.com/nrwl/nx/issues/29438
         *
         * Either disable this rule or build every project and reset the
         * workspace before linting - otherwise this rule reports false
         * positives in cia via 'nx affected' commands.
         */
        'error',
        nxDependencyChecksRuleOptions,
      ],
    },
  },
  // https://nx.dev/nx-api/eslint-plugin#enforce-module-boundaries-rule
  {
    files: ['**/*.ts', '**/*.mts', '**/*.cts', '**/*.tsx'],
    languageOptions: {
      parser: eslintTs.parser,
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.mts',
      '**/*.cts',
      '**/*.tsx',
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs',
      '**/*.jsx',
    ],
    ignores: [
      /**
       * We exlude all config files from the dependency checks rule as they are
       * not part of the runtime code because e.g. a web project may depend on a
       * node tool for building or testing.
       */
      '**/vite.config.*',
      '**/vitest.config.*',
      '**/eslint.config.*',
    ],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [],
        },
      ],
    },
  },
] as Linter.Config[];

export default nxPlusEslintNxConfig;
