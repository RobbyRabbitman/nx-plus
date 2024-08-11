import {
  getPackageManagerCommand,
  readCachedProjectGraph,
  workspaceRoot,
} from '@nx/devkit';
import { execSync } from 'child_process';

describe('commits of `@robby-rabbitman/nx-plus`', () => {
  const runCommitlint = (commitMessage: string) =>
    execSync(
      `${getPackageManagerCommand().exec} nx run tools-commitlint:exec:message --value '${commitMessage}'`,
      {
        cwd: workspaceRoot,
      },
    );

  it('should follow conventional format', () => {
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

  it('should reference projects of this workspace when scoped', () => {
    const projects = Object.keys(readCachedProjectGraph().nodes);

    for (const project of projects) {
      expect(() =>
        runCommitlint(`feat(${project}): supa dupa feature`),
      ).not.toThrow();
    }

    expect(() =>
      runCommitlint('feat(not-a-project-of-nx-plus): supa dupa feature'),
    ).toThrow();
  });
});
