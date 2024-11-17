import { RuleConfigSeverity, type UserConfig } from '@commitlint/types';
import { readCachedProjectGraph } from '@nx/devkit';

const getNxProjects = () => Object.keys(readCachedProjectGraph().nodes);

export default {
  // TODO: https://github.com/conventional-changelog/commitlint/issues/4113
  // extends: ['@commitlint/config-conventional', '@commitlint/config-nx-scopes'],
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': () => [RuleConfigSeverity.Error, 'always', getNxProjects()],
  },
} satisfies UserConfig;
