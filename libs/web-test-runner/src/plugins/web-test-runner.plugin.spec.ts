import { type DirectoryJSON, vol } from 'memfs';
import { minimatch } from 'minimatch';
import { createNodesV2 } from './web-test-runner.plugin.js';

vi.mock('fs', async () => {
  const memfs = await vi.importActual<typeof import('memfs')>('memfs');

  return memfs.fs;
});

describe('[Unit Test] createNodesV2 - createWebTestRunnerTarget', () => {
  beforeEach(() => {
    vol.reset();
  });

  const [createNodesV2Glob, createNodesV2Fn] = createNodesV2;

  async function inferWebTestRunnerTarget({
    directories,
    schema,
  }: {
    directories: DirectoryJSON;
    schema?: Parameters<typeof createNodesV2Fn>[1];
  }) {
    const workspaceRoot = 'some-workspace-root';

    vol.fromJSON(directories, workspaceRoot);

    return createNodesV2Fn(
      Object.keys(directories).filter((file) =>
        minimatch(file, createNodesV2Glob, { dot: true }),
      ),
      schema,
      {
        workspaceRoot,
        nxJsonConfiguration: {},
      },
    );
  }

  describe('a `Web Test Runner` config in a directory of the workspace', () => {
    it('should not modify the project graph by default', async () => {
      /**
       * A `Web Test Runner` config on its own should not modify the project
       * graph. It should be present in a _project root_.
       */

      const nodes = await inferWebTestRunnerTarget({
        directories: {
          'some/directory/web-test-runner.config.js': '{}',
        },
      });

      expect(nodes).toContainEqual([
        'some/directory/web-test-runner.config.js',
        {},
      ]);
    });

    describe('should add a `Web Test Runner` target', () => {
      it('when a `package.json` is present', async () => {
        const nodes = await inferWebTestRunnerTarget({
          directories: {
            'some/project/web-test-runner.config.js': '{}',
            'some/project/package.json': '{}',
          },
        });

        expect(nodes).toContainEqual([
          'some/project/web-test-runner.config.js',
          expect.objectContaining({
            projects: {
              'some/project': {
                targets: {
                  test: expect.anything(),
                },
              },
            },
          }),
        ]);
      });

      it('when a `project.json` is present', async () => {
        const nodes = await inferWebTestRunnerTarget({
          directories: {
            'some/project/web-test-runner.config.js': '{}',
            'some/project/project.json': '{}',
          },
        });

        expect(nodes).toContainEqual([
          'some/project/web-test-runner.config.js',
          expect.objectContaining({
            projects: {
              'some/project': {
                targets: {
                  test: expect.anything(),
                },
              },
            },
          }),
        ]);
      });
    });

    it('should run the `Web Test Runner` in the root of the project pointing to the inferred config', async () => {
      const nodes = await inferWebTestRunnerTarget({
        directories: {
          'some/project/web-test-runner.config.js': '{}',
          'some/project/package.json': '{}',
        },
      });

      expect(nodes).toContainEqual([
        'some/project/web-test-runner.config.js',
        expect.objectContaining({
          projects: {
            'some/project': {
              targets: {
                test: {
                  command: 'web-test-runner',
                  options: {
                    cwd: 'some/project',
                    config: 'web-test-runner.config.js',
                  },
                },
              },
            },
          },
        }),
      ]);
    });

    describe('schema', () => {
      describe('testTargetName', () => {
        it('should use the provided value', async () => {
          const testTargetName = 'web-test-runner';

          const nodes = await inferWebTestRunnerTarget({
            directories: {
              'some/project/web-test-runner.config.js': '{}',
              'some/project/project.json': '{}',
            },
            schema: {
              testTargetName,
            },
          });

          expect(nodes).toContainEqual([
            'some/project/web-test-runner.config.js',
            expect.objectContaining({
              projects: {
                'some/project': {
                  targets: {
                    [testTargetName]: expect.anything(),
                  },
                },
              },
            }),
          ]);
        });

        it('should fall back to `test` when the provided value is an empty string', async () => {
          const testTargetName = '';

          const nodes = await inferWebTestRunnerTarget({
            directories: {
              'some/project/web-test-runner.config.js': '{}',
              'some/project/project.json': '{}',
            },
            schema: {
              testTargetName,
            },
          });

          expect(nodes).toContainEqual([
            'some/project/web-test-runner.config.js',
            expect.objectContaining({
              projects: {
                'some/project': {
                  targets: {
                    test: expect.anything(),
                  },
                },
              },
            }),
          ]);
        });

        it('should fall back to `test` when the value is not provided', async () => {
          const nodes = await inferWebTestRunnerTarget({
            directories: {
              'some/project/web-test-runner.config.js': '{}',
              'some/project/project.json': '{}',
            },
            schema: {},
          });

          expect(nodes).toContainEqual([
            'some/project/web-test-runner.config.js',
            expect.objectContaining({
              projects: {
                'some/project': {
                  targets: {
                    test: expect.anything(),
                  },
                },
              },
            }),
          ]);
        });
      });

      describe('testTargetConfig', () => {
        it('should set the default target configuration', async () => {
          const nodes = await inferWebTestRunnerTarget({
            directories: {
              'some/project/web-test-runner.config.js': '{}',
              'some/project/package.json': '{}',
            },
            schema: {
              testTargetConfig: {
                dependsOn: ['pre-test'],
              },
            },
          });

          expect(nodes).toContainEqual([
            'some/project/web-test-runner.config.js',
            expect.objectContaining({
              projects: {
                'some/project': {
                  targets: {
                    test: expect.objectContaining({
                      dependsOn: ['pre-test'],
                    }),
                  },
                },
              },
            }),
          ]);
        });
      });
    });
  });
});
