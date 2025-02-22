import { readCachedProjectGraph, workspaceRoot } from '@nx/devkit';
import { spawnSync } from 'child_process';

describe('[Integration Test] commits of Nx Plus', () => {
  const commitlintProjectName = process.env.NX_TASK_TARGET_PROJECT as string;

  function invokeCommitlint(commitMessage: string) {
    return spawnSync(
      'pnpm',
      `nx run ${commitlintProjectName}:lint-commitlint`.split(' '),
      {
        cwd: workspaceRoot,
        encoding: 'utf-8',
        env: {
          ...process.env,
          NX_PLUS_TOOLS_COMMITLINT_TEXT: commitMessage,
        },
      },
    );
  }

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

    const commitLintResult = invokeCommitlint(
      `not_a_valid_type: type that does not exist`,
    );

    expect(commitLintResult.status).toBe(1);

    // Check that each valid type appears within the "type must be one of [ ... ]" section
    for (const validType of validTypes) {
      expect(commitLintResult.stdout).toMatch(
        new RegExp(`type must be one of \\[.*${validType}.*\\]`),
      );
    }
  });

  it('should reference projects when scoped', () => {
    const projects = Object.keys(readCachedProjectGraph().nodes);

    expect(projects.length).toBeGreaterThan(0);

    const commitLintResult = invokeCommitlint(
      'feat(not-a-project): supa dupa feature',
    );
    expect(commitLintResult.status).toBe(1);

    // Check that each project appears within the "scope must be one of [ ... ]" section
    for (const project of projects) {
      expect(commitLintResult.stdout).toMatch(
        new RegExp(`scope must be one of \\[.*${project}.*\\]`),
      );
    }
  });
});
