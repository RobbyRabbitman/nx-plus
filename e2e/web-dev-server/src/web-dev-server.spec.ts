import { NxJsonConfiguration, ProjectConfiguration } from '@nx/devkit';
import { readJson } from '@nx/plugin/testing';
import { createE2eWorkspace } from '@robby-rabbitman/nx-plus-libs-e2e-util';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

// TODO: keep in sync with package.json of 'web-dev-server'
// reference it via env or nx devkit?
const nxVersions = ['^17', '^18', '^19'];

for (const nxVersion of nxVersions) {
  describe(`@robby-rabbitman/nx-plus-web-dev-server with nx@${nxVersion}`, () => {
    let workspaceRoot = '';

    beforeAll(() => {
      const workspace = createE2eWorkspace({
        e2eProjectName: 'web-dev-server-e2e',
        nxVersion,
      });
      workspaceRoot = workspace.workspaceRoot;
    });

    it('should install succesfully', () => {
      execSync(`npm i -D @robby-rabbitman/nx-plus-web-dev-server@e2e`, {
        cwd: workspaceRoot,
      });
      execSync('npm ls @robby-rabbitman/nx-plus-web-dev-server', {
        cwd: workspaceRoot,
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

      execSync('touch some-js-project/web-dev-server.config.js', {
        cwd: workspaceRoot,
      });

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
          command:
            'web-dev-server --config=some-js-project/web-dev-server.config.js',
        },
      });
    });
  });
}
