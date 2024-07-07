import { CreateNodesContextV2 } from '@nx/devkit';
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
          'package.json': '{}',
          'project.json': '{}',
          'web-test-runner.config.js': '{}',
        },
      });

      expect(nodes).toStrictEqual([['web-test-runner.config.js', {}]]);
    });
  });

  describe('directory with web-test-runner config', () => {
    it('should not create a target', async () => {
      const nodes = await createNodes({
        directories: {
          'some/directory/web-test-runner.config.js': '{}',
        },
      });

      expect(nodes).toStrictEqual([
        ['some/directory/web-test-runner.config.js', {}],
      ]);
    });

    it('should create a target when `package.json` is present', async () => {
      const nodes = await createNodes({
        directories: {
          'some/directory/web-test-runner.config.js': '{}',
          'some/directory/package.json': '{}',
        },
      });

      expect(nodes).toStrictEqual([
        [
          'some/directory/web-test-runner.config.js',
          {
            projects: {
              'some/directory': {
                targets: {
                  test: {
                    command:
                      'web-test-runner --config=some/directory/web-test-runner.config.js',
                  },
                },
              },
            },
          },
        ],
      ]);
    });

    it('should create a target when `project.json` is present', async () => {
      const nodes = await createNodes({
        directories: {
          'some/directory/web-test-runner.config.js': '{}',
          'some/directory/project.json': '{}',
        },
      });

      expect(nodes).toStrictEqual([
        [
          'some/directory/web-test-runner.config.js',
          {
            projects: {
              'some/directory': {
                targets: {
                  test: {
                    command:
                      'web-test-runner --config=some/directory/web-test-runner.config.js',
                  },
                },
              },
            },
          },
        ],
      ]);
    });

    it.todo('merge target defaults? is nx doing this in a later stage?');

    it('should create a custom named target when specified', async () => {
      const nodes = await createNodes({
        directories: {
          'some/directory/web-test-runner.config.js': '{}',
          'some/directory/project.json': '{}',
        },
        options: {
          targetName: 'web-test-runner-test',
        },
      });

      expect(nodes).toStrictEqual([
        [
          'some/directory/web-test-runner.config.js',
          {
            projects: {
              'some/directory': {
                targets: {
                  'web-test-runner-test': {
                    command:
                      'web-test-runner --config=some/directory/web-test-runner.config.js',
                  },
                },
              },
            },
          },
        ],
      ]);
    });
  });
});
