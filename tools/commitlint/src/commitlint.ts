import { RuleConfigSeverity, type UserConfig } from '@commitlint/types';
import { readCachedProjectGraph } from '@nx/devkit';

/**
 * The commitlint configuration for Nx Plus.
 *
 * - Enforce conventional commit format
 * - Scopes must reference projects in the workspace
 *
 * @see https://www.npmjs.com/package/@commitlint/config-conventional
 */
export const nxPlusCommitlintConfig = {
  extends: [
    /**
     * Extending from this config enables the conventional commit format.
     * https://www.npmjs.com/package/@commitlint/config-conventional
     */
    '@commitlint/config-conventional',
  ],
  rules: {
    /**
     * We set the `scope-enum` rule to enforce that the scope must be one of the
     * projects in the workspace.
     *
     * - Valid: 'feat(@robby-rabbitman/nx-plus-tools-commitlint): add new feature'
     * - Not valid: 'feat(not-a-project): add new feature'
     */
    'scope-enum': () => [
      RuleConfigSeverity.Error,
      'always',
      Object.keys(readCachedProjectGraph().nodes),
    ],
  },
} satisfies UserConfig;

export default nxPlusCommitlintConfig;
