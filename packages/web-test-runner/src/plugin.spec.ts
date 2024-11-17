import { CreateNodesContextV2 } from '@nx/devkit';
import { DirectoryJSON, vol } from 'memfs';
import { minimatch } from 'minimatch';
import {
  createNodes,
  createNodesV2,
  WebTestRunnerTargetPluginSchema,
} from './plugin.js';

vi.mock('node:fs', () => vi.importActual('memfs').then((m) => m.fs));

describe('@robby-rabbitman/nx-plus-web-test-runner/plugin', () => {
  const context = {
    nxJsonConfiguration: {
      targetDefaults: {
        test: {
          command: "echo 'I am the default test command'",
        },
      },
      namedInputs: {
        default: ['{projectRoot}/**/*'],
      },
    },
    workspaceRoot: 'tmp/web-test-runner',
  } satisfies CreateNodesContextV2;

  afterEach(() => {
    vol.reset();
    vi.resetModules();
  });

  describe('createNodes', () => {
    const [createNodesGlob, createNodesFn] = createNodes;

    const runCreateNodes = ({
      directories,
      options,
    }: {
      directories: DirectoryJSON;
      options?: WebTestRunnerTargetPluginSchema;
    }) => {
      vol.fromJSON(directories, context.workspaceRoot);

      const configFiles = Object.keys(directories).filter((file) =>
        minimatch(file, createNodesGlob, { dot: true }),
      );

      return Promise.all(
        configFiles.map((match) =>
          createNodesFn(match, options, { ...context, configFiles }),
        ),
      );
    };

    describe('with a web-test-runner config in the workspace root', () => {
      it('should not modify the project graph', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'package.json': '{}',
            'project.json': '{}',
            'web-test-runner.config.js': '{}',
          },
        });

        expect(nodes).toEqual([{}]);
      });
    });

    describe('with a web-test-runner config in a directory of the workspace', () => {
      it('should not modify the project graph by default', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'some/directory/web-test-runner.config.js': '{}',
          },
        });

        expect(nodes).toEqual([{}]);
      });

      it('should add a web-test-runner test target when a project is identified because a `package.json` is present', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'some/project/web-test-runner.config.js': '{}',
            'some/project/package.json': '{}',
          },
        });

        expect(nodes).toContainEqual(
          expect.objectContaining({
            projects: {
              ['some/project']: {
                targets: {
                  test: expect.anything(),
                },
              },
            },
          }),
        );
      });

      it('should add a web-test-runner test target when a project is identified because a `project.json` is present', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'some/project/web-test-runner.config.js': '{}',
            'some/project/project.json': '{}',
          },
        });

        expect(nodes).toContainEqual(
          expect.objectContaining({
            projects: {
              ['some/project']: {
                targets: {
                  test: expect.anything(),
                },
              },
            },
          }),
        );
      });

      it('should run the web-test-runner in the root of the project pointing to the inferred config', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'some/project/web-test-runner.config.js': '{}',
            'some/project/package.json': '{}',
          },
        });

        expect(nodes).toContainEqual(
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
        );
      });

      describe('schema', () => {
        describe('testTargetName', () => {
          it('should use the provided value', async () => {
            const testTargetName = 'web-test-runner';

            const nodes = await runCreateNodes({
              directories: {
                'some/project/web-test-runner.config.js': '{}',
                'some/project/project.json': '{}',
              },
              options: {
                testTargetName,
              },
            });

            expect(nodes).toContainEqual(
              expect.objectContaining({
                projects: {
                  ['some/project']: {
                    targets: {
                      [testTargetName]: expect.anything(),
                    },
                  },
                },
              }),
            );
          });

          it('should fall back to `test` when the provided value is an empty string', async () => {
            const testTargetName = '';

            const nodes = await runCreateNodes({
              directories: {
                'some/project/web-test-runner.config.js': '{}',
                'some/project/project.json': '{}',
              },
              options: {
                testTargetName,
              },
            });

            expect(nodes).toContainEqual(
              expect.objectContaining({
                projects: {
                  ['some/project']: {
                    targets: {
                      test: expect.anything(),
                    },
                  },
                },
              }),
            );
          });

          it('should fall back to `test` when the value is not provided', async () => {
            const nodes = await runCreateNodes({
              directories: {
                'some/project/web-test-runner.config.js': '{}',
                'some/project/project.json': '{}',
              },
              options: {},
            });

            expect(nodes).toContainEqual(
              expect.objectContaining({
                projects: {
                  ['some/project']: {
                    targets: {
                      test: expect.anything(),
                    },
                  },
                },
              }),
            );
          });
        });

        describe('testTargetConfig', () => {
          it('should allow to override the default target configuration', async () => {
            const nodes = await runCreateNodes({
              directories: {
                'some/project/web-test-runner.config.js': '{}',
                'some/project/package.json': '{}',
              },
              options: {
                testTargetConfig: {
                  dependsOn: ['pre-test'], // add dependsOn property
                },
              },
            });

            expect(nodes).toContainEqual(
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
            );
          });
        });
      });
    });
  });

  describe('createNodesV2', () => {
    const [createNodesV2Glob, createNodesV2Fn] = createNodesV2;

    const runCreateNodesV2 = async ({
      directories,
      options,
    }: {
      directories: DirectoryJSON;
      options?: WebTestRunnerTargetPluginSchema;
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

    describe('with a web-test-runner config in a directory of the workspace', () => {
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

      it('should add a web-test-runner test target when a project is identified because a `package.json` is present', async () => {
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

      it('should add a web-test-runner test target when a project is identified because a `project.json` is present', async () => {
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
              options: {
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
              options: {
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
              options: {},
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
          it('should allow to override the default target configuration', async () => {
            const nodes = await runCreateNodesV2({
              directories: {
                'some/project/web-test-runner.config.js': '{}',
                'some/project/package.json': '{}',
              },
              options: {
                testTargetConfig: {
                  dependsOn: ['pre-test'], // add dependsOn property
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
