// @ts-check
import nxEslintPlugin from '@nx/eslint-plugin';
import jsoncEslintParser from 'jsonc-eslint-parser';
import tsEslint from 'typescript-eslint';

/** TODO: @type {import('eslint').Linter.Config[]} */
/** @type {Object[]} */
const nxEslintConfig = [
  { plugins: { '@nx': nxEslintPlugin } },
  // https://nx.dev/nx-api/eslint-plugin#dependency-checks-rule
  {
    files: ['**/*.json'],
    languageOptions: {
      parser: jsoncEslintParser,
    },
    rules: {
      '@nx/dependency-checks': [
        /**
         * TODO: enable this rule.
         *
         * Observation: this rule doesn't regognize dependencies that are
         * clearly used, however nx graph also doesnt show them, so maybe its
         * not a problem of this rule but rather a graph bug or a miss
         * configured workspace
         */
        'off',
        {
          buildTargets: ['eslint-nx-dependency-checks-pseudo-build'],
        },
      ],
    },
  },
  // https://nx.dev/nx-api/eslint-plugin#enforce-module-boundaries-rule
  {
    files: ['**/*.ts', '**/*.mts', '**/*.cts', '**/*.tsx'],
    languageOptions: {
      parser: tsEslint.parser,
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
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: 'type:lib',
              onlyDependOnLibsWithTags: ['type:lib', 'type:tool', 'type:util'],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util', 'type:tool'],
            },
            {
              sourceTag: 'type:tool',
              onlyDependOnLibsWithTags: ['type:util', 'type:tool'],
            },
            {
              sourceTag: 'type:e2e',
              onlyDependOnLibsWithTags: ['type:*'],
            },
            {
              sourceTag: 'scope:js',
              onlyDependOnLibsWithTags: ['scope:js'],
            },
            {
              sourceTag: 'scope:node',
              onlyDependOnLibsWithTags: ['scope:js', 'scope:node'],
            },
            {
              sourceTag: 'scope:web',
              onlyDependOnLibsWithTags: ['scope:js', 'scope:web'],
            },
          ],
        },
      ],
    },
  },
];

export default {
  configs: {
    base: nxEslintConfig,
  },
};
