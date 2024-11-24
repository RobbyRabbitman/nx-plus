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
import nxPlusWebTestRunnerPackageJson from '@robby-rabbitman/nx-plus-web-test-runner/package.json';
import { execSync } from 'child_process';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join, relative } from 'path';
import packageJson from '../../package.json';

describe(
  '[E2e Test] @robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
  {
    timeout: 10 * 60 * 1000,
  },
  () => {
    let workspaceRoot: string;
    let packageManagerCommand: ReturnType<typeof getPackageManagerCommand>;

    const readNxJson = () =>
      readJsonFile<NxJsonConfiguration>(join(workspaceRoot, 'nx.json'));

    const writeNxJson = (nxJson: NxJsonConfiguration) =>
      writeJsonFile(join(workspaceRoot, 'nx.json'), nxJson);

    const someWebAppName = 'some-web-app';
    const getSomeWebAppProjectRoot = () =>
      join(workspaceRoot, 'packages', someWebAppName);

    const writeWebTestRunnerConfig = async (options: {
      path: string;
      config: object;
    }) => {
      const { path, config } = options;

      await writeFile(path, `export default ${JSON.stringify(config)};`);
    };

    const getWebTestRunnerConfig = async (path: string) => {
      const config = await import(path);

      return config.default as object;
    };

    /**
     * Creates a project with a basic web test runner config in
     * packages/{{name}}
     *
     * - Installs `chai` and `@web/test-runner-playwright`
     * - Includes a simple passing test file.
     * - Must be launched with `--playwright`
     */
    const createWebTestRunnerProject = async (options: { name: string }) => {
      const { name } = options;

      const webTestRunnerConfig = {
        files: ['some-math.spec.js'],
        watch: false,
        nodeResolve: true,
      };

      const projectRoot = join(workspaceRoot, 'packages', name);

      await mkdir(projectRoot, {
        recursive: true,
      });

      writeJsonFile(join(projectRoot, 'package.json'), {
        name,
        type: 'module',
      });

      execSync(
        `${packageManagerCommand.add} @web/test-runner-playwright@${packageJson.dependencies['@web/test-runner-playwright']} chai@${packageJson.dependencies['chai']}`,
        {
          cwd: projectRoot,
          stdio: 'inherit',
          encoding: 'utf-8',
        },
      );

      await writeWebTestRunnerConfig({
        path: join(projectRoot, 'web-test-runner.config.js'),
        config: webTestRunnerConfig,
      });

      await writeFile(
        join(projectRoot, 'some-math.spec.js'),
        `
        import { expect } from 'chai';
  
        it('1 + 2 should be 3', () => {
          expect(1 + 2).to.equal(3);
        });
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
          `${packageManagerCommand.add} ${nxPlusWebTestRunnerPackageJson.name}@local @web/test-runner@${nxPlusWebTestRunnerPackageJson.peerDependencies['@web/test-runner']} @web/test-runner-playwright@${packageJson.dependencies['@web/test-runner-playwright']} chai@${packageJson.dependencies['chai']}`,
          {
            cwd: workspaceRoot,
            stdio: 'inherit',
            encoding: 'utf-8',
          },
        );

        const nxJson = readNxJson();
        nxJson.plugins ??= [];
        nxJson.plugins.push(
          `${nxPlusWebTestRunnerPackageJson.name}/plugins/web-test-runner`,
        );
        writeNxJson(nxJson);
      },
      10 * 60 * 1000,
    );

    beforeEach(async () => {
      await rm(getSomeWebAppProjectRoot(), { force: true, recursive: true });
      await createWebTestRunnerProject({
        name: someWebAppName,
      });
    });

    it('should be inferred', async () => {
      const someWebAppProjectConfig = JSON.parse(
        execSync(`nx show project ${someWebAppName} --json`, {
          cwd: workspaceRoot,
          encoding: 'utf-8',
        }),
      ) as ProjectConfiguration;

      expect(someWebAppProjectConfig.targets?.test).toMatchObject({
        executor: 'nx:run-commands',
        options: {
          command: 'web-test-runner',
          config: 'web-test-runner.config.js',
          cwd: relative(workspaceRoot, getSomeWebAppProjectRoot()),
        },
      });
    });

    it('should run the Web Test Runner', async () => {
      const port = await getRandomPort();

      try {
        const webTestRunnerConfiguration = {
          port,
        };

        await writeWebTestRunnerConfig({
          path: join(getSomeWebAppProjectRoot(), 'web-test-runner.config.js'),
          config: {
            ...(await getWebTestRunnerConfig(
              join(getSomeWebAppProjectRoot(), 'web-test-runner.config.js'),
            )),
            ...webTestRunnerConfiguration,
          },
        });

        expect(() =>
          execSync(`${packageManagerCommand.exec} nx test ${someWebAppName}`, {
            cwd: workspaceRoot,
          }),
        ).not.toThrow();
      } finally {
        await releasePort(port);
      }
    });
  },
);
