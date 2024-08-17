import {
  getPackageManagerCommand,
  NxJsonConfiguration,
  writeJsonFile,
} from '@nx/devkit';
import { readJson } from '@nx/plugin/testing';
import { createE2eNxWorkspace } from '@robby-rabbitman/nx-plus-libs-e2e-util';
import {
  getE2eVersionMatrixProject,
  installE2eVersionMatrixProject,
} from '@robby-rabbitman/nx-plus-libs-e2e-version-matrix';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { WebDevServerInitGeneratorSchema } from 'packages/web-dev-server/src/generators/init';

describe(`@robby-rabbitman/nx-plus-web-dev-server:init`, () => {
  const npm = getPackageManagerCommand('npm');
  let workspaceRoot: string;
  let nxJsonSnapShotAfterCreateE2eNxWorkspace: NxJsonConfiguration;

  beforeAll(() => {
    const { e2eWorkspaceName, e2ePackage } = getE2eVersionMatrixProject();

    if (!e2ePackage.peerDependencies['nx']) {
      throw new Error('nx not in peer dependencies!');
    }

    workspaceRoot = createE2eNxWorkspace({
      e2eProjectName: 'web-dev-server-e2e',
      e2eNxWorkspaceName: `init-${e2eWorkspaceName}`,
      e2eNxVersion: e2ePackage.peerDependencies.nx,
      createNxWorkspaceArgs: '--preset apps',
    });

    nxJsonSnapShotAfterCreateE2eNxWorkspace = readJson(
      join(workspaceRoot, 'nx.json'),
    );

    installE2eVersionMatrixProject({
      package: e2ePackage,
      workspaceRoot,
      packageManagerCommand: npm,
    });
  });

  beforeEach(() => {
    writeJsonFile(
      join(workspaceRoot, 'nx.json'),
      nxJsonSnapShotAfterCreateE2eNxWorkspace,
    );
  });

  const runInitGenerator = ({
    schema,
  }: {
    schema: WebDevServerInitGeneratorSchema;
  }) => {
    const args = Object.entries(schema)
      .map(([name, value]) => `--${name}=${value}`)
      .join(' ');

    execSync(
      `nx generate @robby-rabbitman/nx-plus-web-dev-server:init ${args}`,
      {
        cwd: workspaceRoot,
      },
    );

    const nxJson = readJson<NxJsonConfiguration>(
      join(workspaceRoot, 'nx.json'),
    );

    return { nxJson };
  };

  describe('should not modify the `nx.json` when the plugin is already registered in the `nx.json`', () => {
    it('when provided as an string', async () => {
      const before = structuredClone(nxJsonSnapShotAfterCreateE2eNxWorkspace);

      before.plugins = ['@robby-rabbitman/nx-plus-web-dev-server/plugin'];

      writeJsonFile(join(workspaceRoot, 'nx.json'), before);

      const { nxJson } = runInitGenerator({ schema: {} });

      expect(nxJson).toEqual(before);
    });

    it('when provided as an object', async () => {
      const before = structuredClone(nxJsonSnapShotAfterCreateE2eNxWorkspace);

      const serveTargetName = 'I am already registered :D';

      before.plugins = [
        {
          plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
          options: {
            serveTargetName,
          } satisfies WebDevServerInitGeneratorSchema,
        },
      ];

      writeJsonFile(join(workspaceRoot, 'nx.json'), before);

      const { nxJson } = runInitGenerator({ schema: {} });

      expect(nxJson).toEqual(before);
    });
  });

  it('should register the plugin in the `nx.json` when the plugin is not registered in the `nx.json`', async () => {
    const { nxJson } = runInitGenerator({ schema: {} });

    expect(nxJson.plugins).toContainEqual(
      expect.objectContaining({
        plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
      }),
    );
  });

  describe('schema', () => {
    describe('serveTargetName', () => {
      it('should use the provided value', () => {
        const serveTargetName = 'web-dev-server';

        const { nxJson } = runInitGenerator({ schema: { serveTargetName } });

        expect(nxJson.plugins).toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
            options: {
              serveTargetName,
            } satisfies WebDevServerInitGeneratorSchema,
          }),
        );
      });

      it('should fall back to `serve` when the provided value is an empty string', () => {
        const serveTargetName = '';

        const { nxJson } = runInitGenerator({ schema: { serveTargetName } });

        expect(nxJson.plugins).toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
            options: {
              serveTargetName: 'serve',
            } satisfies WebDevServerInitGeneratorSchema,
          }),
        );
      });

      it('should fall back to `serve` when the value is not provided', () => {
        const { nxJson } = runInitGenerator({ schema: {} });

        expect(nxJson.plugins).toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
            options: {
              serveTargetName: 'serve',
            } satisfies WebDevServerInitGeneratorSchema,
          }),
        );
      });
    });

    describe.todo('skipFormatFiles');

    describe('skipAddPlugin', () => {
      it('should add the plugin to `nx.json` when the value is not provided', () => {
        const { nxJson } = runInitGenerator({ schema: {} });

        expect(nxJson.plugins).toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
          }),
        );
      });

      it('should add the plugin to `nx.json` when the provided value is `false`', () => {
        const { nxJson } = runInitGenerator({
          schema: { skipAddPlugin: false },
        });

        expect(nxJson.plugins).toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
          }),
        );
      });

      it('should not add the plugin to `nx.json` when the provided value is `true`', () => {
        expect(
          nxJsonSnapShotAfterCreateE2eNxWorkspace.plugins ?? [],
        ).not.toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
          }),
        );

        const { nxJson } = runInitGenerator({
          schema: { skipAddPlugin: true },
        });

        expect(nxJson.plugins ?? []).not.toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
          }),
        );
      });
    });
  });
});
