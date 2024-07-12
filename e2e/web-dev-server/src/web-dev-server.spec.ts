import { NxJsonConfiguration, ProjectConfiguration } from '@nx/devkit';
import { readJson } from '@nx/plugin/testing';
import { createE2eWorkspace } from '@robby-rabbitman/nx-plus-libs-e2e-util';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createVersionPermutations } from './util';

const versionMatrix = createVersionPermutations({
  // nxVersions: ['^17', '^18', '^19'],
  nxVersions: ['^19'],
  e2eProject: '@robby-rabbitman/nx-plus-web-dev-server@local',
  peerDependencies: {
    '@web/dev-server': ['^0.4.6'],
  },
});

for (const { nxVersion, e2eProject, peerDependencies } of versionMatrix) {
  describe(`${e2eProject} with nx@${nxVersion}`, () => {
    let workspaceRoot = '';

    beforeAll(() => {
      const workspace = createE2eWorkspace({
        e2eProjectName: 'web-dev-server-e2e',
        workspaceName: `web-dev-server-e2e--${Date.now()}`,
        nxVersion,
      });
      workspaceRoot = workspace.workspaceRoot;
    });

    it('should install succesfully', () => {
      execSync(`npm i -D ${e2eProject}`, {
        cwd: workspaceRoot,
      });

      execSync(
        `npm i -D ${Object.entries(peerDependencies)
          .map((dep_version) => dep_version.join('@'))
          .join(' ')}`,
        {
          cwd: workspaceRoot,
        },
      );
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
        join(workspaceRoot, 'some-js-project/web-dev-server.config.js'),
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
          config: 'web-dev-server.config.js',
          cwd: 'some-js-project',
          watch: true,
        },
      });
    });
  });
}
