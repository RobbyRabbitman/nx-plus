import {
  detectPackageManager,
  getPackageManagerCommand,
  readJsonFile,
  writeJsonFile,
  type NxJsonConfiguration,
} from '@nx/devkit';
import { createE2eNxWorkspace } from '@robby-rabbitman/nx-plus-node-e2e-util';
import nxPlusWebDevServerPackageJson from '@robby-rabbitman/nx-plus-web-dev-server/package.json';
import { execSync } from 'child_process';
import { join } from 'path';

describe(
  '[E2e Test] @robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server',
  {
    timeout: 10 * 60 * 1000,
  },
  () => {
    const webDevServerNpmPackage = '@web/dev-server';
    const webDevServerVersion =
      nxPlusWebDevServerPackageJson.peerDependencies[webDevServerNpmPackage];

    let workspaceRoot: string;
    let packageManagerCommand: ReturnType<typeof getPackageManagerCommand>;

    const readNxJson = () =>
      readJsonFile<NxJsonConfiguration>(join(workspaceRoot, 'nx.json'));

    const writeNxJson = (nxJson: NxJsonConfiguration) =>
      writeJsonFile(join(workspaceRoot, 'nx.json'), nxJson);

    beforeAll(
      async () => {
        workspaceRoot = await createE2eNxWorkspace({
          name: 'robby-rabbitman__nx-plus-web-test-runner__plugins__web-dev-server',
          args: {
            packageManager: 'pnpm',
            preset: 'ts',
            workspaceType: 'integrated',
          },
        });

        packageManagerCommand = getPackageManagerCommand(
          detectPackageManager(workspaceRoot),
          workspaceRoot,
        );

        execSync(
          `${packageManagerCommand.add} ${webDevServerNpmPackage}@${webDevServerVersion}`,
          {
            cwd: workspaceRoot,
            stdio: 'inherit',
            encoding: 'utf-8',
          },
        );

        execSync(
          `${packageManagerCommand.add} ${nxPlusWebDevServerPackageJson.name}@local ${webDevServerNpmPackage}@${webDevServerVersion}`,
          {
            cwd: workspaceRoot,
            stdio: 'inherit',
            encoding: 'utf-8',
          },
        );

        const nxJson = readNxJson();
        nxJson.plugins ??= [];
        nxJson.plugins.push(
          `${nxPlusWebDevServerPackageJson.name}/plugins/web-dev-server`,
        );
        writeNxJson(nxJson);
      },
      10 * 60 * 1000,
    );

    it('should be inferred', async () => {
      execSync(
        'nx generate @nx/js:library --no-interactive --directory packages/some-web-project --name=some-web-project --linter=none --unitTestRunner=none --js --minimal',
        {
          cwd: workspaceRoot,
          stdio: 'inherit',
          encoding: 'utf-8',
        },
      );

      execSync(packageManagerCommand.install, {
        cwd: workspaceRoot,
        stdio: 'inherit',
        encoding: 'utf-8',
      });
    });
  },
);
