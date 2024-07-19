import {
  getPackageManagerCommand,
  NxJsonConfiguration,
  ProjectConfiguration,
} from '@nx/devkit';
import { readJson } from '@nx/plugin/testing';
import {
  createE2eNxWorkspace,
  installProject,
  readE2eProject,
} from '@robby-rabbitman/nx-plus-libs-e2e-util';
import { WebTestRunnerTargetPluginSchema } from '@robby-rabbitman/nx-plus-web-test-runner/plugin';
import { TestRunnerConfig } from '@web/test-runner';
import { execSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

describe(`@robby-rabbitman/nx-plus-web-test-runner/plugin`, () => {
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
      e2eProjectName: 'web-test-runner-e2e',
      e2eNxWorkspaceName: `plugin${e2eWorkspaceName}`,
      e2eNxVersion: e2ePackage.peerDependencies.nx,
      createNxWorkspaceArgs: '--preset apps',
    });

    installProject({
      package: e2ePackage,
      workspaceRoot,
      packageManagerCommand: npm,
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
        testTargetName: 'test',
      } satisfies WebTestRunnerTargetPluginSchema,
    });
  });

  it('should infer the Web Test Runner', () => {
    execSync(
      'nx generate @nx/js:library --name=some-project --linter=none --projectNameAndRootFormat=as-provided --unitTestRunner=none --no-interactive',
      {
        cwd: workspaceRoot,
      },
    );

    const webTestRunnerConfiguration = {
      files: '**/*.spec.js',
      nodeResolve: true,
      watch: false,
    } satisfies TestRunnerConfig;

    writeFileSync(
      join(workspaceRoot, 'some-project/web-test-runner.config.mjs'),
      `export default ${JSON.stringify(webTestRunnerConfiguration, null, 2)};`,
    );

    const project = JSON.parse(
      execSync('nx show project some-project --json', {
        cwd: workspaceRoot,
        encoding: 'utf-8',
      }),
    ) as ProjectConfiguration;

    expect(project.targets.test).toMatchObject({
      executor: 'nx:run-commands',
      options: {
        command: 'web-test-runner',
        config: 'web-test-runner.config.mjs',
        cwd: 'some-project',
      },
    });
  });

  it('should run the Web Test Runner', () => {
    rmSync(join(workspaceRoot, 'some-project/src'), {
      recursive: true,
      force: true,
    });

    execSync(`${npm.addDev} @esm-bundle/chai`, {
      cwd: workspaceRoot,
    });

    writeFileSync(
      join(workspaceRoot, 'some-project/some-test.spec.js'),
      `
      import { expect } from '@esm-bundle/chai';

      it('1 + 2 should be 3', () => {
        expect(1 + 2).to.equal(3);
      });
      `,
    );

    expect(() =>
      execSync('nx run some-project:test', {
        cwd: workspaceRoot,
      }),
    ).not.throw();

    writeFileSync(
      join(workspaceRoot, 'some-project/some-test-that-fails.spec.js'),
      `
      import { expect } from '@esm-bundle/chai';

      it('1 + 2 should be 3', () => {
        throw new Error("whoops O_O");
        expect(1 + 2).to.equal(3);
      });
      `,
    );

    expect(() =>
      execSync('nx run some-project:test', {
        cwd: workspaceRoot,
      }),
    ).toThrow();
  });
});
