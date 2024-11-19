import { type DirectoryJSON, vol } from 'memfs';
import { minimatch } from 'minimatch';
import {
  createNodesV2,
  type WebTestRunnerPluginSchema,
} from './web-test-runner.plugin.js';

vi.mock('fs', async () => {
  const memfs = await vi.importActual<typeof import('memfs')>('memfs');
  return memfs.fs;
});

describe('[Unit Test] @robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner', () => {
  afterEach(() => {
    vol.reset();
    vi.resetModules();
  });

  describe('createNodesV2', () => {
    const [createNodesV2Glob, createNodesV2Fn] = createNodesV2;

    const runCreateNodesV2 = async ({
      directories,
      schema,
    }: {
      directories: DirectoryJSON;
      schema?: WebTestRunnerPluginSchema;
    }) => {
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
    };

    describe('with a web-test-runner config in the workspace root', () => {
      it('should not modify the project graph', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            'package.json': '{}',
            'project.json': '{}',
            'web-test-runner.config.js': '{}',
          },
        });

        expect(nodes).toContainEqual(['web-test-runner.config.js', {}]);
      });
    });

    describe('with a web-test-runner config in a sub directory of the workspace', () => {
      it('should not modify the project graph by default', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            'some/directory/web-test-runner.config.js': '{}',
          },
        });

        expect(nodes).toContainEqual([
          'some/directory/web-test-runner.config.js',
          {},
        ]);
      });

      describe('should add a web-test-runner target', () => {
        it('when a `package.json` is present', async () => {
          const nodes = await runCreateNodesV2({
            directories: {
              'some/project/web-test-runner.config.js': '{}',
              'some/project/package.json': '{}',
            },
          });

          expect(nodes).toContainEqual([
            'some/project/web-test-runner.config.js',
            expect.objectContaining({
              projects: {
                ['some/project']: {
                  targets: {
                    test: expect.anything(),
                  },
                },
              },
            }),
          ]);
        });

        it('when a `project.json` is present', async () => {
          const nodes = await runCreateNodesV2({
            directories: {
              'some/project/web-test-runner.config.js': '{}',
              'some/project/project.json': '{}',
            },
          });

          expect(nodes).toContainEqual([
            'some/project/web-test-runner.config.js',
            expect.objectContaining({
              projects: {
                ['some/project']: {
                  targets: {
                    test: expect.anything(),
                  },
                },
              },
            }),
          ]);
        });
      });

      it('should run the web-test-runner in the root of the project pointing to the inferred config', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            'some/project/web-test-runner.config.js': '{}',
            'some/project/package.json': '{}',
          },
        });

        expect(nodes).toContainEqual([
          'some/project/web-test-runner.config.js',
          expect.objectContaining({
            projects: {
              ['some/project']: {
                targets: {
                  test: expect.objectContaining({
                    command: 'web-test-runner',
                    options: expect.objectContaining({
                      cwd: '{projectRoot}',
                      config: 'web-test-runner.config.js',
                    }),
                  }),
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

            const nodes = await runCreateNodesV2({
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
                  ['some/project']: {
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

            const nodes = await runCreateNodesV2({
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
                  ['some/project']: {
                    targets: {
                      test: expect.anything(),
                    },
                  },
                },
              }),
            ]);
          });

          it('should fall back to `test` when the value is not provided', async () => {
            const nodes = await runCreateNodesV2({
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
                  ['some/project']: {
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
            const nodes = await runCreateNodesV2({
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
                  ['some/project']: {
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
});
