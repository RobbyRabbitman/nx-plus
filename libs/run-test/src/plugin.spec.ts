import { CreateNodesContextV2, ProjectConfiguration } from '@nx/devkit';
import { DirectoryJSON, vol } from 'memfs';
import { minimatch } from 'minimatch';
import { RunTestPluginOptions, createNodesV2 } from './plugin';

jest.mock('node:fs', () => {
  return jest.requireActual('memfs').fs;
});

describe('@robby-rabbitman/nx-plus-web-test-runner/plugin', () => {
  const context = {
    nxJsonConfiguration: {
      targetDefaults: {
        test: {
          command: "echo 'I am the default target command'",
        },
      },
      namedInputs: {
        default: ['{projectRoot}/**/*'],
      },
    },
    workspaceRoot: 'tmp/web-test-runner-plugin',
  } satisfies CreateNodesContextV2;

  const [createNodesGlob, createNodesFn] = createNodesV2;

  const createNodes = ({
    directories,
    options,
  }: {
    directories: DirectoryJSON;
    options?: RunTestPluginOptions;
  }) => {
    vol.fromJSON(directories, context.workspaceRoot);

    return createNodesFn(
      Object.keys(directories).filter((file) =>
        minimatch(file, createNodesGlob, { dot: true }),
      ),
      options,
      context,
    );
  };

  afterEach(() => {
    vol.reset();
    jest.resetModules();
  });

  describe('workspace root with web-test-runner config', () => {
    it('should not create a target', async () => {
      const nodes = await createNodes({
        directories: {
          'foo/project.json': JSON.stringify({
            name: 'foo',
            root: 'foo',
            targets: {
              test: {},
            },
          } satisfies ProjectConfiguration),
        },
      });
    });
  });
});
