import { NxJsonConfiguration, ProjectConfiguration } from '@nx/devkit';
import { readJson } from '@nx/plugin/testing';
import {
  createE2eNxWorkspace,
  installE2eProject,
  readE2eProject,
} from '@robby-rabbitman/nx-plus-libs-e2e-util';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

describe(`@robby-rabbitman/nx-plus-web-test-runner`, () => {
  const { e2eNxWorkspaceName, e2ePackage } = readE2eProject({
    peerDependencyEnvPrefix: 'E2E_PEER_DEPENDENCY_',
  });

  if (!e2ePackage.peerDependencies['nx']) {
    throw new Error('nx not in peer dependencies!');
  }

  const workspaceRoot = createE2eNxWorkspace({
    e2eProjectName: 'web-test-runner-e2e',
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

  it("should add the plugin '@robby-rabbitman/nx-plus-web-test-runner/plugin'", () => {
    execSync('nx generate @robby-rabbitman/nx-plus-web-test-runner:init', {
      cwd: workspaceRoot,
    });

    const nxJson = readJson<NxJsonConfiguration>(
      join(workspaceRoot, 'nx.json'),
    );

    expect(nxJson.plugins).toContainEqual({
      plugin: '@robby-rabbitman/nx-plus-web-test-runner/plugin',
      options: {
        targetName: 'test',
      },
    });
  });

  it('should infer the Web Test Runner', () => {
    execSync(
      'nx generate @nx/js:library --name=some-js-project --linter=none --projectNameAndRootFormat=as-provided --unitTestRunner=none --no-interactive',
      {
        cwd: workspaceRoot,
      },
    );

    execSync('touch some-js-project/web-test-runner.config.js', {
      cwd: workspaceRoot,
    });

    const project = JSON.parse(
      execSync('nx show project some-js-project --json', {
        cwd: workspaceRoot,
        encoding: 'utf-8',
      }),
    ) as ProjectConfiguration;

    const testTarget = project.targets['test'];

    expect(testTarget).toEqual({
      configurations: {},
      executor: 'nx:run-commands',
      options: {
        command:
          'web-test-runner --config=some-js-project/web-test-runner.config.js',
      },
    });
  });
});
