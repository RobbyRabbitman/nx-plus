import { CreateNodesContextV2 } from '@nx/devkit';
import { DirectoryJSON, vol } from 'memfs';
import { minimatch } from 'minimatch';
import {
  WebTestRunnerTargetPluginOptions,
  createNodes,
  createNodesV2,
  defaultOptions,
} from './plugin';

jest.mock('node:fs', () => {
  return jest.requireActual('memfs').fs;
});

describe('@robby-rabbitman/nx-plus-web-test-runner/plugin', () => {
  const context = {
    nxJsonConfiguration: {
      targetDefaults: {
        [defaultOptions.targetName]: {
          command: `echo 'I am the default target of ${defaultOptions.targetName}'`,
        },
      },
      namedInputs: {
        default: ['{projectRoot}/**/*'],
      },
    },
    workspaceRoot: 'tmp/web-test-runner-plugin',
  } satisfies CreateNodesContextV2;

  afterEach(() => {
    vol.reset();
    jest.resetModules();
  });

  describe('createNodes', () => {
    const [createNodesGlob, createNodesFn] = createNodes;

    const runCreateNodes = ({
      directories,
      options,
    }: {
      directories: DirectoryJSON;
      options?: WebTestRunnerTargetPluginOptions;
    }) => {
      vol.fromJSON(directories, context.workspaceRoot);

      const configFiles = Object.keys(directories).filter((file) =>
        minimatch(file, createNodesGlob, { dot: true }),
      );

      return configFiles.map((match) =>
        createNodesFn(match, options, { ...context, configFiles }),
      );
    };

    describe('workspace root with web-test-runner config', () => {
      it('should not create a target', () => {
        const nodes = runCreateNodes({
          directories: {
            'package.json': '{}',
            'project.json': '{}',
            'web-test-runner.config.js': '{}',
          },
        });

        expect(nodes).toEqual([{}]);
      });
    });

    describe('directory with web-test-runner config', () => {
      it('should not create a target', () => {
        const nodes = runCreateNodes({
          directories: {
            'some/directory/web-test-runner.config.js': '{}',
          },
        });

        expect(nodes).toEqual([{}]);
      });

      it('should create a target when `package.json` is present', () => {
        const nodes = runCreateNodes({
          directories: {
            'some/directory/web-test-runner.config.js': '{}',
            'some/directory/package.json': '{}',
          },
        });

        expect(nodes).toEqual([
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
        ]);
      });

      it('should create a target when `project.json` is present', () => {
        const nodes = runCreateNodes({
          directories: {
            'some/directory/web-test-runner.config.js': '{}',
            'some/directory/project.json': '{}',
          },
        });

        expect(nodes).toEqual([
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
        ]);
      });

      it.todo('merge target defaults? is nx doing this in a later stage?');

      it('should create a custom named target when specified', () => {
        const nodes = runCreateNodes({
          directories: {
            'some/directory/web-test-runner.config.js': '{}',
            'some/directory/project.json': '{}',
          },
          options: {
            targetName: 'web-test-runner-test',
          },
        });

        expect(nodes).toEqual([
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
        ]);
      });
    });
  });

  describe('createNodesV2', () => {
    const [createNodesV2Glob, createNodesV2Fn] = createNodesV2;

    const runCreateNodesV2 = ({
      directories,
      options,
    }: {
      directories: DirectoryJSON;
      options?: WebTestRunnerTargetPluginOptions;
    }) => {
      vol.fromJSON(directories, context.workspaceRoot);

      return createNodesV2Fn(
        Object.keys(directories).filter((file) =>
          minimatch(file, createNodesV2Glob, { dot: true }),
        ),
        options,
        context,
      );
    };

    describe('workspace root with web-test-runner config', () => {
      it('should not create a target', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            'package.json': '{}',
            'project.json': '{}',
            'web-test-runner.config.js': '{}',
          },
        });

        expect(nodes).toEqual([['web-test-runner.config.js', {}]]);
      });
    });

    describe('directory with web-test-runner config', () => {
      it('should not create a target', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            'some/directory/web-test-runner.config.js': '{}',
          },
        });

        expect(nodes).toEqual([
          ['some/directory/web-test-runner.config.js', {}],
        ]);
      });

      it('should create a target when `package.json` is present', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            'some/directory/web-test-runner.config.js': '{}',
            'some/directory/package.json': '{}',
          },
        });

        expect(nodes).toEqual([
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
        const nodes = await runCreateNodesV2({
          directories: {
            'some/directory/web-test-runner.config.js': '{}',
            'some/directory/project.json': '{}',
          },
        });

        expect(nodes).toEqual([
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
        const nodes = await runCreateNodesV2({
          directories: {
            'some/directory/web-test-runner.config.js': '{}',
            'some/directory/project.json': '{}',
          },
          options: {
            targetName: 'web-test-runner-test',
          },
        });

        expect(nodes).toEqual([
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
});
