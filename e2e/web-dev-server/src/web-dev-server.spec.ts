import { NxJsonConfiguration, ProjectConfiguration } from '@nx/devkit';
import { readJson } from '@nx/plugin/testing';
import {
  createE2eNxWorkspace,
  installE2eProject,
  readE2eProject,
} from '@robby-rabbitman/nx-plus-libs-e2e-util';
import { execUntil } from '@robby-rabbitman/nx-plus-libs-node-util';
import { execSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

describe(`@robby-rabbitman/nx-plus-web-dev-server`, () => {
  const { e2eNxWorkspaceName, e2ePackage } = readE2eProject({
    peerDependencyEnvPrefix: 'E2E_PEER_DEPENDENCY_',
  });

  if (!e2ePackage.peerDependencies['nx']) {
    throw new Error('nx not in peer dependencies!');
  }

  const workspaceRoot = createE2eNxWorkspace({
    e2eProjectName: 'web-dev-server-e2e',
    e2eNxWorkspaceName,
    e2eNxVersion: e2ePackage.peerDependencies.nx,
    createNxWorkspaceArgs: '--preset apps',
  });

  it('should install succesfully', () => {
    installE2eProject({
      package: e2ePackage,
      workspaceRoot,
    });
  });

  it("should add the plugin '@robby-rabbitman/nx-plus-web-dev-server/plugin'", () => {
    execSync('nx generate @robby-rabbitman/nx-plus-web-dev-server:init', {
      cwd: workspaceRoot,
    });

    const nxJson = readJson<NxJsonConfiguration>(
      join(workspaceRoot, 'nx.json'),
    );

    expect(nxJson.plugins).toContainEqual({
      plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
      options: {
        targetName: 'serve',
      },
    });
  });

  it('should infer the Web Dev Server', () => {
    execSync(
      'nx generate @nx/js:library --name=some-js-project --linter=none --projectNameAndRootFormat=as-provided --unitTestRunner=none --no-interactive',
      {
        cwd: workspaceRoot,
      },
    );

    const config = {};

    writeFileSync(
      join(workspaceRoot, 'some-js-project/web-dev-server.config.mjs'),
      `export default ${JSON.stringify(config, null, 2)};`,
    );

    const project = JSON.parse(
      execSync('nx show project some-js-project --json', {
        cwd: workspaceRoot,
        encoding: 'utf-8',
      }),
    ) as ProjectConfiguration;

    const testTarget = project.targets['serve'];

    expect(testTarget).toEqual({
      configurations: {},
      executor: 'nx:run-commands',
      options: {
        command: 'web-dev-server',
        config: 'web-dev-server.config.mjs',
        cwd: 'some-js-project',
        watch: true,
      },
    });
  });

  it('should run the Web Dev Server', async () => {
    rmSync(join(workspaceRoot, 'some-js-project/src'), {
      recursive: true,
      force: true,
    });

    writeFileSync(
      join(workspaceRoot, 'some-js-project/index.html'),
      'hi, not valid html but w/e O_O',
    );

    await execUntil(
      'nx run some-js-project:serve',
      (log) => log.includes('Web Dev Server started...'),
      {
        cwd: workspaceRoot,
      },
    );
  });
});
