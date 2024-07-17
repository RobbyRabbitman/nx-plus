import { getPackageManagerCommand, workspaceRoot } from '@nx/devkit';
import { execSync } from 'child_process';

describe('commits of `@robby-rabbitman/nx-plus`', () => {
  const runCommitlint = (commitMessage: string) =>
    execSync(
      `${getPackageManagerCommand().exec} nx run tools-commitlint:exec:message --value '${commitMessage}'`,
      {
        cwd: workspaceRoot,
        stdio: 'ignore',
      },
    );

  it('must follow conventional commit format', () => {
    const validTypes = [
      'build',
      'ci',
      'chore',
      'docs',
      'feat',
      'fix',
      'perf',
      'refactor',
      'revert',
      'style',
      'test',
    ];

    for (const type of validTypes) {
      const commitMessage = `${type}: some message`;
      expect(() => runCommitlint(commitMessage)).not.toThrow();
    }

    expect(() => runCommitlint('not-a-valid-type: some message')).toThrow();
  });

  it('scoped commits must reference projects of this workspace', () => {
    expect(() =>
      runCommitlint('feat(tools-commitlint): supa dupa feature'),
    ).not.toThrow();

    expect(() =>
      runCommitlint('feat(not-a-project-of-nx-plus): supa dupa feature'),
    ).toThrow();
  });
});
