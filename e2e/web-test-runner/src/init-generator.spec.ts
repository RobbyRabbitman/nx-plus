import {
  getPackageManagerCommand,
  NxJsonConfiguration,
  writeJsonFile,
} from '@nx/devkit';
import { readJson } from '@nx/plugin/testing';
import {
  createE2eNxWorkspace,
  installProject,
  readE2eProject,
} from '@robby-rabbitman/nx-plus-libs-e2e-util';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { WebTestRunnerInitGeneratorSchema } from 'packages/web-test-runner/src/generators/init';

describe(`@robby-rabbitman/nx-plus-web-test-runner:init`, () => {
  const npm = getPackageManagerCommand('npm');
  let workspaceRoot: string;
  let nxJsonSnapShotAfterCreateE2eNxWorkspace: NxJsonConfiguration;

  beforeAll(() => {
    const { e2eWorkspaceName, e2ePackage } = readE2eProject({
      peerDependencyEnvPrefix: 'E2E_PEER_DEPENDENCY_',
    });

    if (!e2ePackage.peerDependencies['nx']) {
      throw new Error('nx not in peer dependencies!');
    }

    workspaceRoot = createE2eNxWorkspace({
      e2eProjectName: 'web-test-runner-e2e',
      e2eNxWorkspaceName: `init${e2eWorkspaceName}`,
      e2eNxVersion: e2ePackage.peerDependencies.nx,
      createNxWorkspaceArgs: '--preset apps',
    });

    nxJsonSnapShotAfterCreateE2eNxWorkspace = readJson(
      join(workspaceRoot, 'nx.json'),
    );

    installProject({
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
    schema: WebTestRunnerInitGeneratorSchema;
  }) => {
    const args = Object.entries(schema)
      .map(([name, value]) => `--${name}=${value}`)
      .join(' ');

    execSync(
      `nx generate @robby-rabbitman/nx-plus-web-test-runner:init ${args}`,
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

      before.plugins = ['@robby-rabbitman/nx-plus-web-test-runner/plugin'];

      writeJsonFile(join(workspaceRoot, 'nx.json'), before);

      const { nxJson } = runInitGenerator({ schema: {} });

      expect(nxJson).toEqual(before);
    });

    it('when provided as an object', async () => {
      const before = structuredClone(nxJsonSnapShotAfterCreateE2eNxWorkspace);

      const testTargetName = 'I am already registered :D';

      before.plugins = [
        {
          plugin: '@robby-rabbitman/nx-plus-web-test-runner/plugin',
          options: {
            testTargetName,
          } satisfies WebTestRunnerInitGeneratorSchema,
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
        plugin: '@robby-rabbitman/nx-plus-web-test-runner/plugin',
      }),
    );
  });
});
