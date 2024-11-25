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

describe('[E2e Test] @robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner', () => {
  let workspaceRoot: string;
  let port: number;
  let packageManagerCommand: ReturnType<typeof getPackageManagerCommand>;

  const readNxJson = () =>
    readJsonFile<NxJsonConfiguration>(join(workspaceRoot, 'nx.json'));

  const writeNxJson = (nxJson: NxJsonConfiguration) =>
    writeJsonFile(join(workspaceRoot, 'nx.json'), nxJson);

  const someWebTestRunnerProjectName = 'some-web-app';

  const getProjectRootOfSomeWebTestRunnerProject = () =>
    join(workspaceRoot, 'packages', someWebTestRunnerProjectName);

  const writeWebTestRunnerConfig = async (options: {
    path: string;
    config: object;
  }) => {
    const { path, config } = options;

    await writeFile(path, `export default ${JSON.stringify(config)};`);
  };

  /**
   * Creates a project with a basic web test runner config in packages/{{name}}
   * expected to be run with playwright.
   *
   * - Uses `chai` for assertions.
   * - Includes a simple passing test file.
   * - Includes a simple failing test file.
   * - Defaults to running the passing test file.
   * - Must be launched with `--playwright`
   */
  const createWebTestRunnerProject = async (options: {
    name: string;
    webTestRunnerConfig?: object;
  }) => {
    const { name } = options;

    const webTestRunnerConfig = {
      files: ['some-legit-math.spec.js'],
      watch: false,
      nodeResolve: true,
      ...options.webTestRunnerConfig,
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
      join(projectRoot, 'some-legit-math.spec.js'),
      `
        import { expect } from 'chai';
  
        it('1 + 2 should be 3', () => {
          expect(1 + 2).to.equal(3);
        });
        `,
    );

    await writeFile(
      join(projectRoot, 'some-failing-math.spec.js'),
      `
        import { expect } from 'chai';
  
        it('2 + 2 should be 3', () => {
          expect(2 + 2).to.equal(3);
        });
        `,
    );
  };

  /**
   * Creates a nx workspace with the following configuration:
   *
   * - Package Manager: pnpm
   * - Preset: ts
   * - Installs `@robby-rabbitman/nx-plus-web-test-runner`, `@web/test-runner`,
   *   `@web/test-runner-playwright`, and `chai`
   * - Adds `@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner` to
   *   the Nx plugins
   */
  const createNxWorkspace = async () => {
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
  };

  beforeAll(
    async () => {
      await createNxWorkspace();
    },
    5 * 60 * 1000,
  );

  beforeEach(
    async () => {
      port = await getRandomPort();

      await rm(getProjectRootOfSomeWebTestRunnerProject(), {
        force: true,
        recursive: true,
      });

      await createWebTestRunnerProject({
        name: someWebTestRunnerProjectName,
        webTestRunnerConfig: {
          port,
        },
      });

      execSync(`${packageManagerCommand.exec} nx reset`, {
        cwd: workspaceRoot,
        stdio: 'inherit',
      });

      expect(
        execSync(`${packageManagerCommand.exec} nx show projects --json`, {
          cwd: workspaceRoot,
          encoding: 'utf-8',
        }),
      ).toContain(someWebTestRunnerProjectName);
    },
    2 * 60 * 1000,
  );

  afterEach(
    async () => {
      await releasePort(port);
    },
    1 * 60 * 1000,
  );

  it('should be inferred', async () => {
    const someWebAppProjectConfig = JSON.parse(
      execSync(`nx show project ${someWebTestRunnerProjectName} --json`, {
        cwd: workspaceRoot,
        encoding: 'utf-8',
      }),
    ) as ProjectConfiguration;

    expect(someWebAppProjectConfig.targets?.test).toMatchObject({
      executor: 'nx:run-commands',
      options: {
        command: 'web-test-runner',
        config: 'web-test-runner.config.js',
        cwd: relative(
          workspaceRoot,
          getProjectRootOfSomeWebTestRunnerProject(),
        ),
      },
    });
  });

  describe('should run the Web Test Runner', () => {
    it('some-legit-math.spec.js', () => {
      expect(() =>
        execSync(
          `${packageManagerCommand.exec} nx test ${someWebTestRunnerProjectName} --playwright --files some-legit-math.spec.js`,
          {
            cwd: workspaceRoot,
            stdio: 'inherit',
          },
        ),
      ).not.toThrow();
    });

    it('some-failing-math.spec.js', () => {
      expect(() =>
        execSync(
          `${packageManagerCommand.exec} nx test ${someWebTestRunnerProjectName} --playwright --files some-failing-math.spec.js`,
          {
            cwd: workspaceRoot,
            stdio: 'inherit',
          },
        ),
      ).toThrow();
    });
  });
});
