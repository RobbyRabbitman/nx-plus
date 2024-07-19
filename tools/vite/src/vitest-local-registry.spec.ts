import { execSync } from 'child_process';

describe('vitest local registry config', () => {
  it('should publish this workspace', () => {
    const registrySearchResult = JSON.parse(
      execSync(`pnpm search '@robby-rabbitman/nx-plus' --json`, {
        encoding: 'utf-8',
      }),
    ) as { name: string }[];

    expect(registrySearchResult).toMatchObject([
      {
        name: '@robby-rabbitman/nx-plus-web-test-runner',
        version: '0.0.0-local',
      },
      {
        name: '@robby-rabbitman/nx-plus-web-dev-server',
        version: '0.0.0-local',
      },
    ]);
  });
});
