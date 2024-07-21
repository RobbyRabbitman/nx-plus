import {
  getPackageManagerCommand,
  NxJsonConfiguration,
  ProjectConfiguration,
  writeJsonFile,
} from '@nx/devkit';
import { readJson } from '@nx/plugin/testing';
import {
  installProject,
  readE2eProject,
} from '@robby-rabbitman/nx-plus-libs-e2e-util';
import {
  createE2eNxWorkspace,
  getRandomPort,
} from '@robby-rabbitman/nx-plus-libs-e2e-util/main';
import { execUntil } from '@robby-rabbitman/nx-plus-libs-node-util';
import { DevServerConfig } from '@web/dev-server';
import { execSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

describe('@robby-rabbitman/nx-plus-web-dev-server/plugin', () => {
  const npm = getPackageManagerCommand('npm');
  let workspaceRoot: string;

  beforeAll(() => {
    const { e2eWorkspaceName, e2ePackage } = readE2eProject({
      peerDependencyEnvPrefix: 'E2E_PEER_DEPENDENCY_',
    });

    if (!e2ePackage.peerDependencies['nx']) {
      throw new Error('nx not in peer dependencies!');
    }

    workspaceRoot = createE2eNxWorkspace({
      e2eProjectName: 'web-dev-server-e2e',
      e2eNxWorkspaceName: `plugin${e2eWorkspaceName}`,
      e2eNxVersion: e2ePackage.peerDependencies.nx,
      createNxWorkspaceArgs: '--preset apps',
    });

    installProject({
      package: e2ePackage,
      workspaceRoot,
      packageManagerCommand: npm,
    });

    const nxJsonPath = join(workspaceRoot, 'nx.json');
    const nxJson = readJson<NxJsonConfiguration>(nxJsonPath);
    nxJson.plugins ??= [];
    nxJson.plugins.push('@robby-rabbitman/nx-plus-web-dev-server/plugin');
    writeJsonFile(nxJsonPath, nxJson);
  });

  it('should infer the Web Dev Server', async () => {
    execSync(
      'nx generate @nx/js:library --name=some-project --linter=none --projectNameAndRootFormat=as-provided --unitTestRunner=none --no-interactive',
      {
        cwd: workspaceRoot,
      },
    );

    const webDevServerConfiguration = {
      port: await getRandomPort(),
    } satisfies DevServerConfig;

    writeFileSync(
      join(workspaceRoot, 'some-project/web-dev-server.config.mjs'),
      `export default ${JSON.stringify(webDevServerConfiguration, null, 2)};`,
    );

    const project = JSON.parse(
      execSync('nx show project some-project --json', {
        cwd: workspaceRoot,
        encoding: 'utf-8',
      }),
    ) as ProjectConfiguration;

    expect(project.targets.serve).toMatchObject({
      executor: 'nx:run-commands',
      options: {
        command: 'web-dev-server',
        config: 'web-dev-server.config.mjs',
        cwd: 'some-project',
      },
    });
  });

  it('should run the Web Dev Server', async () => {
    rmSync(join(workspaceRoot, 'some-project/src'), {
      recursive: true,
      force: true,
    });

    writeFileSync(
      join(workspaceRoot, 'some-project/index.html'),
      'hi, not valid html but w/e O_O',
    );

    await execUntil(
      'nx run some-project:serve',
      (log) => log.includes('Web Dev Server started...'),
      {
        cwd: workspaceRoot,
      },
    );
  });
});
