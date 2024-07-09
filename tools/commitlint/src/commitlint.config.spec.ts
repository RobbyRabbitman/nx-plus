import { getPackageManagerCommand, workspaceRoot } from '@nx/devkit';
import { execSync } from 'child_process';

describe.skip('commitlint config', () => {
  const runCommitlint = (commitMessage: string) =>
    execSync(
      `${getPackageManagerCommand().exec} nx run tools-commitlint:exec:message --value '${commitMessage}'`,
      {
        cwd: workspaceRoot,
        stdio: 'ignore',
      },
    );

  const commitMessage_expectToPass = {
    'not_a_valid_type: add documentation': false,
    'docs(not-a-valid-scope): add documentation': false,
    'docs(tools-commitlint): add documentation': true,
    'docs: add documentation': true,
  };

  for (const [commitMessage, expectToPass] of Object.entries(
    commitMessage_expectToPass,
  )) {
    it(commitMessage, () => {
      let actualPass = true;

      try {
        runCommitlint(commitMessage);
      } catch {
        actualPass = false;
      }

      expect(actualPass).toBe(expectToPass);
    });
  }
});
