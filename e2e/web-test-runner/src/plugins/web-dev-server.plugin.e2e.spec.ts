import {
  detectPackageManager,
  getPackageManagerCommand,
  readJsonFile,
  writeJsonFile,
  type NxJsonConfiguration,
  type ProjectConfiguration,
} from '@nx/devkit';
import {
  createE2eNxWorkspace,
  getRandomPort,
  releasePort,
} from '@robby-rabbitman/nx-plus-node-e2e-util';
import { execUntil } from '@robby-rabbitman/nx-plus-node-util';
import nxPlusWebDevServerPackageJson from '@robby-rabbitman/nx-plus-web-test-runner/package.json';
import { execSync } from 'child_process';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join, relative } from 'path';

describe(
  '[E2e Test] @robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
  {
    timeout: 10 * 60 * 1000,
  },
  () => {
    const webDevServerNpmPackage = '@web/dev-server';
    const webDevServerVersion =
      nxPlusWebDevServerPackageJson.peerDependencies[webDevServerNpmPackage];

    let workspaceRoot: string;
    let packageManagerCommand: ReturnType<typeof getPackageManagerCommand>;

    const readNxJson = () =>
      readJsonFile<NxJsonConfiguration>(join(workspaceRoot, 'nx.json'));

    const writeNxJson = (nxJson: NxJsonConfiguration) =>
      writeJsonFile(join(workspaceRoot, 'nx.json'), nxJson);

    const someWebAppName = 'some-web-app';
    const getSomeWebAppProjectRoot = () =>
      join(workspaceRoot, 'packages', someWebAppName);

    const writeWebDevServerConfig = async (options: {
      path: string;
      config: object;
    }) => {
      const { path, config } = options;

      await writeFile(path, `export default ${JSON.stringify(config)};`);
    };

    /**
     * Creates a web app in packages/{{name}} with the given
     * `webDevServerConfig` and a simple index.html file in the root.
     */
    const createWebApp = async (options: {
      name: string;
      webDevServerConfig: object;
    }) => {
      const { name, webDevServerConfig } = options;

      const projectRoot = join(workspaceRoot, 'packages', name);

      await mkdir(projectRoot, {
        recursive: true,
      });

      writeJsonFile(join(projectRoot, 'package.json'), {
        name,
        type: 'module',
      });

      await writeWebDevServerConfig({
        path: join(projectRoot, 'web-test-runner.config.js'),
        config: webDevServerConfig,
      });

      await writeFile(
        join(projectRoot, 'index.html'),
        `
        <!DOCTYPE html>
        <html>
          <body>
            <h1>${name}</h1>
          </body>
        </html>
        `,
      );
    };

    beforeAll(
      async () => {
        workspaceRoot = await createE2eNxWorkspace({
          name: 'robby-rabbitman__nx-plus-web-test-runner__plugins__web-test-runner',
          args: {
            packageManager: 'pnpm',
            preset: 'ts',
          },
        });

        packageManagerCommand = getPackageManagerCommand(
          detectPackageManager(workspaceRoot),
          workspaceRoot,
        );

        execSync(
          `${packageManagerCommand.add} ${webDevServerNpmPackage}@${webDevServerVersion}`,
          {
            cwd: workspaceRoot,
            stdio: 'inherit',
            encoding: 'utf-8',
          },
        );

        execSync(
          `${packageManagerCommand.add} ${nxPlusWebDevServerPackageJson.name}@local ${webDevServerNpmPackage}@${webDevServerVersion}`,
          {
            cwd: workspaceRoot,
            stdio: 'inherit',
            encoding: 'utf-8',
          },
        );

        const nxJson = readNxJson();
        nxJson.plugins ??= [];
        nxJson.plugins.push(
          `${nxPlusWebDevServerPackageJson.name}/plugins/web-test-runner`,
        );
        writeNxJson(nxJson);
      },
      10 * 60 * 1000,
    );

    beforeEach(async () => {
      await rm(getSomeWebAppProjectRoot(), { force: true, recursive: true });
      await createWebApp({ name: someWebAppName, webDevServerConfig: {} });
    });

    it('should be inferred', async () => {
      const someWebAppProjectConfig = JSON.parse(
        execSync(`nx show project ${someWebAppName} --json`, {
          cwd: workspaceRoot,
          encoding: 'utf-8',
        }),
      ) as ProjectConfiguration;

      expect(someWebAppProjectConfig.targets?.serve).toMatchObject({
        executor: 'nx:run-commands',
        options: {
          command: 'web-test-runner',
          config: 'web-test-runner.config.js',
          cwd: relative(workspaceRoot, getSomeWebAppProjectRoot()),
        },
      });
    });

    it('should run the Web Dev Server', async () => {
      const port = await getRandomPort();

      try {
        const webDevServerConfiguration = {
          port,
        };

        await writeWebDevServerConfig({
          path: join(getSomeWebAppProjectRoot(), 'web-test-runner.config.js'),
          config: webDevServerConfiguration,
        });

        await execUntil(
          `nx serve ${someWebAppName}`,
          (log) => /Web Dev Server started.../.test(log),
          {
            cwd: workspaceRoot,
          },
        );
      } finally {
        await releasePort(port);
      }
    });
  },
);
