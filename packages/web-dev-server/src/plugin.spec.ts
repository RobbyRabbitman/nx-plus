import { CreateNodesContextV2 } from '@nx/devkit';
import { DirectoryJSON, vol } from 'memfs';
import { minimatch } from 'minimatch';
import {
  WebDevServerTargetPluginSchema,
  createNodes,
  createNodesV2,
} from './plugin';

vi.mock('node:fs', () => vi.importActual('memfs').then((m) => m.fs));

describe('@robby-rabbitman/nx-plus-web-dev-server/plugin', () => {
  const context = {
    nxJsonConfiguration: {
      targetDefaults: {
        serve: {
          command: "echo 'I am the default serve command'",
        },
      },
      namedInputs: {
        default: ['{projectRoot}/**/*'],
      },
    },
    workspaceRoot: 'tmp/web-dev-server',
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
      options?: WebDevServerTargetPluginSchema;
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

    describe('with a web-dev-server config in the workspace root', () => {
      it('should not modify the project graph', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'package.json': '{}',
            'project.json': '{}',
            'web-dev-server.config.js': '{}',
          },
        });

        expect(nodes).toEqual([{}]);
      });
    });

    describe('with a web-dev-server config in a directory of the workspace', () => {
      it('should not modify the project graph by default', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'some/directory/web-dev-server.config.js': '{}',
          },
        });

        expect(nodes).toEqual([{}]);
      });

      it('should add a web-dev-server serve target when a project is identified because a `package.json` is present', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'some/project/web-dev-server.config.js': '{}',
            'some/project/package.json': '{}',
          },
        });

        expect(nodes[0].projects['some/project'].targets).toHaveProperty(
          'serve',
        );
      });

      it('should add a web-dev-server serve target when a project is identified because a `project.json` is present', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'some/project/web-dev-server.config.js': '{}',
            'some/project/project.json': '{}',
          },
        });

        expect(nodes[0].projects['some/project'].targets).toHaveProperty(
          'serve',
        );
      });

      it('should run the web-dev-server in the root of the project pointing to the inferred config', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'some/project/web-dev-server.config.js': '{}',
            'some/project/package.json': '{}',
          },
        });

        expect(nodes).toContainEqual(
          expect.objectContaining({
            projects: {
              ['some/project']: {
                targets: {
                  serve: expect.objectContaining({
                    command: 'web-dev-server',
                    options: expect.objectContaining({
                      cwd: '{projectRoot}',
                      config: 'web-dev-server.config.js',
                    }),
                  }),
                },
              },
            },
          }),
        );
      });

      describe('schema', () => {
        describe('serveTargetName', () => {
          it('should use the provided value', async () => {
            const serveTargetName = 'web-dev-server';

            const nodes = await runCreateNodes({
              directories: {
                'some/project/web-dev-server.config.js': '{}',
                'some/project/project.json': '{}',
              },
              options: {
                serveTargetName,
              },
            });

            expect(nodes).toContainEqual(
              expect.objectContaining({
                projects: {
                  ['some/project']: {
                    targets: {
                      [serveTargetName]: expect.anything(),
                    },
                  },
                },
              }),
            );
          });

          it('should fall back to `serve` when the provided value is an empty string', async () => {
            const serveTargetName = '';

            const nodes = await runCreateNodes({
              directories: {
                'some/project/web-dev-server.config.js': '{}',
                'some/project/project.json': '{}',
              },
              options: {
                serveTargetName,
              },
            });

            expect(nodes).toContainEqual(
              expect.objectContaining({
                projects: {
                  ['some/project']: {
                    targets: {
                      serve: expect.anything(),
                    },
                  },
                },
              }),
            );
          });

          it('should fall back to `serve` when the value is not provided', async () => {
            const nodes = await runCreateNodes({
              directories: {
                'some/project/web-dev-server.config.js': '{}',
                'some/project/project.json': '{}',
              },
              options: {},
            });

            expect(nodes).toContainEqual(
              expect.objectContaining({
                projects: {
                  ['some/project']: {
                    targets: {
                      serve: expect.anything(),
                    },
                  },
                },
              }),
            );
          });
        });

        describe('serveTargetConfig', () => {
          it('should serve in watch mode when not overriden', async () => {
            const nodes = await runCreateNodes({
              directories: {
                'some/project/web-dev-server.config.js': '{}',
                'some/project/project.json': '{}',
              },
              options: {},
            });

            expect(nodes).toContainEqual(
              expect.objectContaining({
                projects: {
                  ['some/project']: {
                    targets: {
                      serve: expect.objectContaining({
                        options: expect.objectContaining({
                          watch: true,
                        }),
                      }),
                    },
                  },
                },
              }),
            );
          });

          it('should allow to override the default target configuration', async () => {
            const nodes = await runCreateNodes({
              directories: {
                'some/project/web-dev-server.config.js': '{}',
                'some/project/package.json': '{}',
              },
              options: {
                serveTargetConfig: {
                  dependsOn: ['pre-serve'], // add dependsOn property
                  options: {
                    watch: false, // override default watch value
                  },
                },
              },
            });

            expect(nodes).toContainEqual(
              expect.objectContaining({
                projects: {
                  ['some/project']: {
                    targets: {
                      serve: expect.objectContaining({
                        dependsOn: ['pre-serve'],
                        options: expect.objectContaining({
                          watch: false,
                        }),
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
      options?: WebDevServerTargetPluginSchema;
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

    describe('workspace root with web-dev-server config', () => {
      it('should not create a target', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            'package.json': '{}',
            'project.json': '{}',
            'web-dev-server.config.js': '{}',
          },
        });

        expect(nodes).toEqual([['web-dev-server.config.js', {}]]);
      });
    });

    describe('directory with web-dev-server config', () => {
      it('should not create a target', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            'some/directory/web-dev-server.config.js': '{}',
          },
        });

        expect(nodes).toEqual([
          ['some/directory/web-dev-server.config.js', {}],
        ]);
      });

      it('should create a target when `package.json` is present', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            'some/directory/web-dev-server.config.js': '{}',
            'some/directory/package.json': '{}',
          },
        });

        expect(nodes[0][1].projects['some/directory'].targets).toHaveProperty(
          'serve',
        );
      });

      it('should create a target when `project.json` is present', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            'some/directory/web-dev-server.config.js': '{}',
            'some/directory/project.json': '{}',
          },
        });

        expect(nodes[0][1].projects['some/directory'].targets).toHaveProperty(
          'serve',
        );
      });

      describe('with the default target config', () => {
        it('should serve in watch mode', async () => {
          const nodes = await runCreateNodesV2({
            directories: {
              'some/directory/web-dev-server.config.js': '{}',
              'some/directory/package.json': '{}',
            },
          });

          const targetConfig = nodes[0][1].projects['some/directory'].targets[
            'serve'
          ] as WebDevServerTargetPluginSchema['targetConfig'];

          expect(targetConfig.options.watch).toEqual(true);
        });

        it('should run the web-test-runner in the root of the project', async () => {
          const nodes = await runCreateNodesV2({
            directories: {
              'some/directory/web-dev-server.config.js': '{}',
              'some/directory/package.json': '{}',
            },
          });

          const targetConfig = nodes[0][1].projects['some/directory'].targets[
            'serve'
          ] as WebDevServerTargetPluginSchema['targetConfig'];

          expect(targetConfig.options.cwd).toEqual('{projectRoot}');
          expect(targetConfig.options.config).toEqual(
            'web-dev-server.config.js',
          );
        });
      });

      it('should create a custom named target when specified', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            'some/directory/web-dev-server.config.js': '{}',
            'some/directory/project.json': '{}',
          },
          options: {
            targetName: 'web-dev-server',
          },
        });

        expect(nodes[0][1].projects['some/directory'].targets).toHaveProperty(
          'web-dev-server',
        );
      });

      it('should allow to override the default target config when specified', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            'some/directory/web-dev-server.config.js': '{}',
            'some/directory/package.json': '{}',
          },
          options: {
            targetConfig: {
              dependsOn: ['pre-serve'],
              options: {
                watch: false,
              },
            },
          },
        });

        const targetConfig = nodes[0][1].projects['some/directory'].targets[
          'serve'
        ] as WebDevServerTargetPluginSchema['targetConfig'];

        expect(targetConfig.dependsOn).toEqual(['pre-serve']);
        expect(targetConfig.options.watch).toEqual(false);
      });
    });
  });
});
