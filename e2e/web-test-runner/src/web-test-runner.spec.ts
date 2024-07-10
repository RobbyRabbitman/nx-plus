import { NxJsonConfiguration, ProjectConfiguration } from '@nx/devkit';
import { readJson } from '@nx/plugin/testing';
import { createE2eWorkspace } from '@robby-rabbitman/nx-plus-tools-local-registry';
import {
  setup,
  teardown,
} from '@robby-rabbitman/nx-plus-tools-vite/local-registry-setup';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

// TODO: keep in sync with package.json of 'web-test-runner'
// reference it via env or nx devkit?
const nxVersions = ['^17', '^18', '^19'];

for (const nxVersion of nxVersions) {
  describe(`@robby-rabbitman/nx-plus-web-test-runner with nx@${nxVersion}`, () => {
    let workspaceRoot = '';

    beforeAll(async () => {
      await setup();
      const workspace = createE2eWorkspace({
        e2eProjectName: 'web-test-runner-e2e',
        nxVersion,
      });
      workspaceRoot = workspace.workspaceRoot;
    });

    afterAll(() => {
      teardown();
    });

    it('should install succesfully', () => {
      execSync(`npm i -D @robby-rabbitman/nx-plus-web-test-runner@e2e`, {
        cwd: workspaceRoot,
      });
      execSync('npm ls @robby-rabbitman/nx-plus-web-test-runner', {
        cwd: workspaceRoot,
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
}
