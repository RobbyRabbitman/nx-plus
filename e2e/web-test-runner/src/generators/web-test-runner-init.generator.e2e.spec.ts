import {
  detectPackageManager,
  getPackageManagerCommand,
  type NxJsonConfiguration,
  readJsonFile,
  writeJsonFile,
} from '@nx/devkit';
import { createE2eNxWorkspace } from '@robby-rabbitman/nx-plus-node-e2e-util';
import { type WebTestRunnerInitGeneratorSchema } from '@robby-rabbitman/nx-plus-web-test-runner';
import nxPlusWebTestRunnerPackageJson from '@robby-rabbitman/nx-plus-web-test-runner/package.json';
import { execSync } from 'child_process';
import { join } from 'path';

describe(
  '[E2e Test] nx generate run @robby-rabbitman/nx-plus-web-test-runner:init',
  {
    timeout: 10 * 60 * 1000,
  },
  () => {
    let workspaceRoot: string;
    let nxJson: NxJsonConfiguration;
    let packageManagerCommand: ReturnType<typeof getPackageManagerCommand>;

    const readNxJson = () =>
      readJsonFile<NxJsonConfiguration>(join(workspaceRoot, 'nx.json'));

    const writeNxJson = (nxJson: NxJsonConfiguration) =>
      writeJsonFile(join(workspaceRoot, 'nx.json'), nxJson);

    /**
     * Before all test run, a nx workspace is created and after each test has
     * run the `nx.json` is restored to save resources.
     */

    beforeAll(
      async () => {
        workspaceRoot = await createE2eNxWorkspace({
          name: 'robby-rabbitman__nx-plus-web-test-runner--init',
          args: {
            preset: 'ts',
          },
        });

        packageManagerCommand = getPackageManagerCommand(
          detectPackageManager(workspaceRoot),
          workspaceRoot,
        );

        execSync(
          `${packageManagerCommand.add} ${nxPlusWebTestRunnerPackageJson.name}@local`,
          {
            cwd: workspaceRoot,
            stdio: 'inherit',
            encoding: 'utf-8',
          },
        );

        nxJson = readNxJson();

        Object.freeze(nxJson);
      },
      10 * 60 * 1000,
    );

    afterEach(() => {
      writeNxJson(nxJson);
    });

    /**
     * Runs the `@robby-rabbitman/nx-plus-web-test-runner:init` generator in the
     * e2e workspace.
     */
    const runWebTestRunnerInitGenerator = (
      schema?: WebTestRunnerInitGeneratorSchema,
    ) => {
      const args = Object.entries(schema ?? {})
        .map(([name, value]) => `--${name}=${value}`)
        .join(' ');

      execSync(
        `${packageManagerCommand.exec} nx generate @robby-rabbitman/nx-plus-web-test-runner:init ${args}`,
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
          '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
        ];

        writeNxJson(nxJsonBefore);

        runWebTestRunnerInitGenerator();

        const nxJsonAfter = readNxJson();

        expect(nxJsonAfter).toEqual(nxJsonBefore);
      });

      it('when declared as an object', async () => {
        const nxJsonBefore = readNxJson();

        nxJsonBefore.plugins = [
          {
            plugin:
              '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
          },
        ];

        writeNxJson(nxJsonBefore);

        runWebTestRunnerInitGenerator();

        const nxJsonAfter = readNxJson();

        expect(nxJsonAfter).toEqual(nxJsonBefore);
      });
    });

    it('should declare the plugin in the `nx.json` when the plugin is not declared in the `nx.json`', async () => {
      runWebTestRunnerInitGenerator();

      expect(readNxJson().plugins).toContainEqual(
        expect.objectContaining({
          plugin:
            '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
        }),
      );
    });

    describe('schema', () => {
      describe('testTargetName', () => {
        it('should use the provided value', () => {
          const testTargetName = 'web-test-runner';

          runWebTestRunnerInitGenerator({ testTargetName });

          expect(readNxJson().plugins).toContainEqual(
            expect.objectContaining({
              plugin:
                '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
              options: {
                testTargetName,
              } satisfies WebTestRunnerInitGeneratorSchema,
            }),
          );
        });

        it('should fall back to `test` when the provided value is an empty string', () => {
          const testTargetName = '';

          runWebTestRunnerInitGenerator({ testTargetName });

          expect(readNxJson().plugins).toContainEqual(
            expect.objectContaining({
              plugin:
                '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
              options: {
                testTargetName: 'test',
              } satisfies WebTestRunnerInitGeneratorSchema,
            }),
          );
        });

        it('should fall back to `test` when the value is not provided', () => {
          runWebTestRunnerInitGenerator();

          expect(readNxJson().plugins).toContainEqual(
            expect.objectContaining({
              plugin:
                '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
              options: {
                testTargetName: 'test',
              } satisfies WebTestRunnerInitGeneratorSchema,
            }),
          );
        });
      });

      describe.todo('skipFormatFiles');

      describe('skipAddPlugin', () => {
        it('should add the plugin to `nx.json` when the value is not provided', () => {
          runWebTestRunnerInitGenerator();

          expect(readNxJson().plugins).toContainEqual(
            expect.objectContaining({
              plugin:
                '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
            }),
          );
        });

        it('should add the plugin to `nx.json` when the provided value is `false`', () => {
          runWebTestRunnerInitGenerator({ skipAddPlugin: false });

          expect(readNxJson().plugins).toContainEqual(
            expect.objectContaining({
              plugin:
                '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
            }),
          );
        });

        it('should not add the plugin to `nx.json` when the provided value is `true`', () => {
          runWebTestRunnerInitGenerator({ skipAddPlugin: true });

          expect(readNxJson().plugins).not.toContainEqual(
            expect.objectContaining({
              plugin:
                '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
            }),
          );
        });
      });
    });
  },
);
