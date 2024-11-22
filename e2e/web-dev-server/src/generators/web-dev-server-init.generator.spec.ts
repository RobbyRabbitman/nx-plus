import {
  detectPackageManager,
  getPackageManagerCommand,
  type NxJsonConfiguration,
  readJsonFile,
  writeJsonFile,
} from '@nx/devkit';
import { createE2eNxWorkspace } from '@robby-rabbitman/nx-plus-node-e2e-util';
import { type WebDevServerInitGeneratorSchema } from '@robby-rabbitman/nx-plus-web-dev-server';
import { spawnSync } from 'child_process';
import { join } from 'path';

describe(
  '[E2e Test] generate run @robby-rabbitman/nx-plus-web-test-runner:init',
  {
    timeout: 10 * 60 * 1000,
  },
  () => {
    let workspaceRoot: string;
    let nxJson: NxJsonConfiguration;

    const readNxJson = () =>
      readJsonFile<NxJsonConfiguration>(join(workspaceRoot, 'nx.json'));

    const writeNxJson = (nxJson: NxJsonConfiguration) =>
      writeJsonFile(join(workspaceRoot, 'nx.json'), nxJson);

    /**
     * Before all test run, a nx workspace is created and after each test has
     * run the `nx.json` is restored to save resources.
     */

    beforeAll(async () => {
      workspaceRoot = await createE2eNxWorkspace({
        name: '@robby-rabbitman/nx-plus-web-test-runner--init',
        args: {
          preset: 'ts',
        },
      });

      nxJson = readNxJson();

      Object.freeze(nxJson);
    });

    afterEach(() => {
      writeNxJson(nxJson);
    });

    /**
     * Runs the `@robby-rabbitman/nx-plus-web-dev-server:init` generator in the
     * e2e workspace. Returns the `nx.json` after running the generator.
     */
    const runWebDevServerInitGenerator = (
      schema?: WebDevServerInitGeneratorSchema,
    ) => {
      const args = Object.entries(schema ?? {})
        .map(([name, value]) => `--${name}=${value}`)
        .join(' ');

      const packageManager = getPackageManagerCommand(
        detectPackageManager(workspaceRoot),
      );

      const result = spawnSync(
        packageManager.exec,
        `nx generate @robby-rabbitman/nx-plus-web-dev-server:init ${args}`
          .trim()
          .split(' '),
        {
          cwd: workspaceRoot,
        },
      );

      if (result.status !== 0) {
        throw result;
      }

      return result;
    };

    describe('should not modify the `nx.json` when the plugin is already registered in the `nx.json`', () => {
      it('when provided as an string', async () => {
        const nxJsonBefore = readNxJson();

        nxJsonBefore.plugins = [
          '@robby-rabbitman/nx-plus-web-dev-server/plugin',
        ];

        writeNxJson(nxJsonBefore);

        runWebDevServerInitGenerator();

        const nxJsonAfter = readNxJson();

        expect(nxJsonAfter).toEqual(nxJsonBefore);
      });

      it('when provided as an object', async () => {
        const nxJsonBefore = readNxJson();

        nxJsonBefore.plugins = [
          {
            plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
          },
        ];

        writeNxJson(nxJsonBefore);

        runWebDevServerInitGenerator();

        const nxJsonAfter = readNxJson();

        expect(nxJsonAfter).toEqual(nxJsonBefore);
      });
    });

    // it('should register the plugin in the `nx.json` when the plugin is not registered in the `nx.json`', async () => {
    //   const { nxJson } = runWebDevServerInitGenerator({ schema: {} });

    //   expect(nxJson.plugins).toContainEqual(
    //     expect.objectContaining({
    //       plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
    //     }),
    //   );
    // });

    // describe('schema', () => {
    //   describe('serveTargetName', () => {
    //     it('should use the provided value', () => {
    //       const serveTargetName = 'web-dev-server';

    //       const { nxJson } = runWebDevServerInitGenerator({
    //         schema: { serveTargetName },
    //       });

    //       expect(nxJson.plugins).toContainEqual(
    //         expect.objectContaining({
    //           plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
    //           options: {
    //             serveTargetName,
    //           } satisfies WebDevServerInitGeneratorSchema,
    //         }),
    //       );
    //     });

    //     it('should fall back to `serve` when the provided value is an empty string', () => {
    //       const serveTargetName = '';

    //       const { nxJson } = runWebDevServerInitGenerator({
    //         schema: { serveTargetName },
    //       });

    //       expect(nxJson.plugins).toContainEqual(
    //         expect.objectContaining({
    //           plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
    //           options: {
    //             serveTargetName: 'serve',
    //           } satisfies WebDevServerInitGeneratorSchema,
    //         }),
    //       );
    //     });

    //     it('should fall back to `serve` when the value is not provided', () => {
    //       const { nxJson } = runWebDevServerInitGenerator({ schema: {} });

    //       expect(nxJson.plugins).toContainEqual(
    //         expect.objectContaining({
    //           plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
    //           options: {
    //             serveTargetName: 'serve',
    //           } satisfies WebDevServerInitGeneratorSchema,
    //         }),
    //       );
    //     });
    //   });

    //   describe.todo('skipFormatFiles');

    //   describe('skipAddPlugin', () => {
    //     it('should add the plugin to `nx.json` when the value is not provided', () => {
    //       const { nxJson } = runWebDevServerInitGenerator({ schema: {} });

    //       expect(nxJson.plugins).toContainEqual(
    //         expect.objectContaining({
    //           plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
    //         }),
    //       );
    //     });

    //     it('should add the plugin to `nx.json` when the provided value is `false`', () => {
    //       const { nxJson } = runWebDevServerInitGenerator({
    //         schema: { skipAddPlugin: false },
    //       });

    //       expect(nxJson.plugins).toContainEqual(
    //         expect.objectContaining({
    //           plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
    //         }),
    //       );
    //     });

    //     it('should not add the plugin to `nx.json` when the provided value is `true`', () => {
    //       expect(nxJson.plugins ?? []).not.toContainEqual(
    //         expect.objectContaining({
    //           plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
    //         }),
    //       );

    //       const { nxJson } = runWebDevServerInitGenerator({
    //         schema: { skipAddPlugin: true },
    //       });

    //       expect(nxJson.plugins ?? []).not.toContainEqual(
    //         expect.objectContaining({
    //           plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
    //         }),
    //       );
    //     });
    //   });
    // });
  },
);
