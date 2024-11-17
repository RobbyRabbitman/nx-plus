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
        'error',
        {
          ignoredDependencies: [
            /**
             * TODO: find out why projects eslint.config.js are ignored - in the
             * nx graph u can see the file as a dependency
             */
            '@robby-rabbitman/nx-plus-tools-eslint',
            /**
             * TODO: find out why projects (vite|vitest).config.ts are ignored -
             * in the nx graph u can see the file as a dependency
             */
            '@robby-rabbitman/nx-plus-tools-vite',
          ],
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
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            {
              sourceTag: 'scope:node',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:node'],
            },
            {
              sourceTag: 'scope:web',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:web'],
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
