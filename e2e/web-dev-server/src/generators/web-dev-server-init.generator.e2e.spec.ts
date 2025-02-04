import {
  detectPackageManager,
  getPackageManagerCommand,
  type NxJsonConfiguration,
  readJsonFile,
  writeJsonFile,
} from '@nx/devkit';
import { createE2eNxWorkspace } from '@robby-rabbitman/nx-plus-node-e2e-util';
import { type WebDevServerInitGeneratorSchema } from '@robby-rabbitman/nx-plus-web-dev-server';
import { execSync } from 'child_process';
import { join } from 'path';

describe('[E2e Test] nx generate run @robby-rabbitman/nx-plus-web-dev-server:init', () => {
  let workspaceRoot: string;
  let nxJson: NxJsonConfiguration;
  let packageManagerCommand: ReturnType<typeof getPackageManagerCommand>;

  const readNxJson = () =>
    readJsonFile<NxJsonConfiguration>(join(workspaceRoot, 'nx.json'));

  const writeNxJson = (nxJson: NxJsonConfiguration) =>
    writeJsonFile(join(workspaceRoot, 'nx.json'), nxJson);

  /**
   * - Before all test run, a nx workspace is created
   * - After each test has run, the `nx.json` is restored to save resources
   *   instead of creating a new nx workspace for each test
   */

  beforeAll(
    async () => {
      workspaceRoot = await createE2eNxWorkspace({
        name: 'robby-rabbitman__nx-plus-web-dev-server--init',
        args: {
          preset: 'ts',
        },
      });

      packageManagerCommand = getPackageManagerCommand(
        detectPackageManager(workspaceRoot),
        workspaceRoot,
      );

      execSync(
        `${packageManagerCommand.add} @robby-rabbitman/nx-plus-web-dev-server@local`,
        {
          cwd: workspaceRoot,
          stdio: 'inherit',
          encoding: 'utf-8',
        },
      );

      nxJson = readNxJson();

      Object.freeze(nxJson);
    },
    5 * 60 * 1000,
  );

  afterEach(() => {
    writeNxJson(nxJson);
  });

  /**
   * Runs the `@robby-rabbitman/nx-plus-web-dev-server:init` generator in the
   * e2e workspace.
   */
  const runWebDevServerInitGenerator = (
    schema?: WebDevServerInitGeneratorSchema,
  ) => {
    const args = Object.entries(schema ?? {})
      .map(([name, value]) => `--${name}=${value}`)
      .join(' ');

    execSync(
      `${packageManagerCommand.exec} nx generate @robby-rabbitman/nx-plus-web-dev-server:init ${args}`,
      {
        cwd: workspaceRoot,
        stdio: 'inherit',
        encoding: 'utf-8',
      },
    );
  };

  describe('should not modify the `nx.json` when the plugin is already registered in the `nx.json`', () => {
    it('when declared as a string', async () => {
      const nxJsonBefore = readNxJson();

      nxJsonBefore.plugins = [
        '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server',
      ];

      writeNxJson(nxJsonBefore);

      runWebDevServerInitGenerator();

      const nxJsonAfter = readNxJson();

      expect(nxJsonAfter).toEqual(nxJsonBefore);
    });

    it('when declared as an object', async () => {
      const nxJsonBefore = readNxJson();

      nxJsonBefore.plugins = [
        {
          plugin:
            '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server',
        },
      ];

      writeNxJson(nxJsonBefore);

      runWebDevServerInitGenerator();

      const nxJsonAfter = readNxJson();

      expect(nxJsonAfter).toEqual(nxJsonBefore);
    });
  });

  it('should declare the plugin in the `nx.json` when the plugin is not declared in the `nx.json`', async () => {
    runWebDevServerInitGenerator();

    expect(readNxJson().plugins).toContainEqual(
      expect.objectContaining({
        plugin:
          '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server',
      }),
    );
  });

  describe('schema', () => {
    describe('serveTargetName', () => {
      it('should use the provided value', () => {
        const serveTargetName = 'web-dev-server';

        runWebDevServerInitGenerator({ serveTargetName });

        expect(readNxJson().plugins).toContainEqual(
          expect.objectContaining({
            plugin:
              '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server',
            options: {
              serveTargetName,
            } satisfies WebDevServerInitGeneratorSchema,
          }),
        );
      });

      it('should fall back to `serve` when the provided value is an empty string', () => {
        const serveTargetName = '';

        runWebDevServerInitGenerator({ serveTargetName });

        expect(readNxJson().plugins).toContainEqual(
          expect.objectContaining({
            plugin:
              '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server',
            options: {
              serveTargetName: 'serve',
            } satisfies WebDevServerInitGeneratorSchema,
          }),
        );
      });

      it('should fall back to `serve` when the value is not provided', () => {
        runWebDevServerInitGenerator();

        expect(readNxJson().plugins).toContainEqual(
          expect.objectContaining({
            plugin:
              '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server',
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
        runWebDevServerInitGenerator();

        expect(readNxJson().plugins).toContainEqual(
          expect.objectContaining({
            plugin:
              '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server',
          }),
        );
      });

      it('should add the plugin to `nx.json` when the provided value is `false`', () => {
        runWebDevServerInitGenerator({ skipAddPlugin: false });

        expect(readNxJson().plugins).toContainEqual(
          expect.objectContaining({
            plugin:
              '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server',
          }),
        );
      });

      it('should not add the plugin to `nx.json` when the provided value is `true`', () => {
        runWebDevServerInitGenerator({ skipAddPlugin: true });

        expect(readNxJson().plugins).not.toContainEqual(
          expect.objectContaining({
            plugin:
              '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server',
          }),
        );
      });
    });
  });
});
