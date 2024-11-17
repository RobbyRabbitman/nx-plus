import { type CreateNodesContextV2 } from '@nx/devkit';
import { type DirectoryJSON, vol } from 'memfs';
import { minimatch } from 'minimatch';
import {
  type WebDevServerTargetPluginSchema,
  createNodes,
  createNodesV2,
} from './plugin.js';

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

      it('should add a web-dev-server serve target when a project is identified because a `project.json` is present', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'some/project/web-dev-server.config.js': '{}',
            'some/project/project.json': '{}',
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

    describe('with a web-dev-server config in the workspace root', () => {
      it('should not modify the project graph', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            'package.json': '{}',
            'project.json': '{}',
            'web-dev-server.config.js': '{}',
          },
        });

        expect(nodes).toContainEqual(['web-dev-server.config.js', {}]);
      });
    });

    describe('with a web-dev-server config in a directory of the workspace', () => {
      it('should not modify the project graph by default', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            'some/directory/web-dev-server.config.js': '{}',
          },
        });

        expect(nodes).toContainEqual([
          'some/directory/web-dev-server.config.js',
          {},
        ]);
      });

      it('should add a web-dev-server serve target when a project is identified because a `package.json` is present', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            'some/project/web-dev-server.config.js': '{}',
            'some/project/package.json': '{}',
          },
        });

        expect(nodes).toContainEqual([
          'some/project/web-dev-server.config.js',
          expect.objectContaining({
            projects: {
              ['some/project']: {
                targets: {
                  serve: expect.anything(),
                },
              },
            },
          }),
        ]);
      });

      it('should add a web-dev-server serve target when a project is identified because a `project.json` is present', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            'some/project/web-dev-server.config.js': '{}',
            'some/project/project.json': '{}',
          },
        });

        expect(nodes).toContainEqual([
          'some/project/web-dev-server.config.js',
          expect.objectContaining({
            projects: {
              ['some/project']: {
                targets: {
                  serve: expect.anything(),
                },
              },
            },
          }),
        ]);
      });

      it('should run the web-dev-server in the root of the project pointing to the inferred config', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            'some/project/web-dev-server.config.js': '{}',
            'some/project/package.json': '{}',
          },
        });

        expect(nodes).toContainEqual([
          'some/project/web-dev-server.config.js',
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
        ]);
      });

      describe('schema', () => {
        describe('serveTargetName', () => {
          it('should use the provided value', async () => {
            const serveTargetName = 'web-dev-server';

            const nodes = await runCreateNodesV2({
              directories: {
                'some/project/web-dev-server.config.js': '{}',
                'some/project/project.json': '{}',
              },
              options: {
                serveTargetName,
              },
            });

            expect(nodes).toContainEqual([
              'some/project/web-dev-server.config.js',
              expect.objectContaining({
                projects: {
                  ['some/project']: {
                    targets: {
                      [serveTargetName]: expect.anything(),
                    },
                  },
                },
              }),
            ]);
          });

          it('should fall back to `serve` when the provided value is an empty string', async () => {
            const serveTargetName = '';

            const nodes = await runCreateNodesV2({
              directories: {
                'some/project/web-dev-server.config.js': '{}',
                'some/project/project.json': '{}',
              },
              options: {
                serveTargetName,
              },
            });

            expect(nodes).toContainEqual([
              'some/project/web-dev-server.config.js',
              expect.objectContaining({
                projects: {
                  ['some/project']: {
                    targets: {
                      serve: expect.anything(),
                    },
                  },
                },
              }),
            ]);
          });

          it('should fall back to `serve` when the value is not provided', async () => {
            const nodes = await runCreateNodesV2({
              directories: {
                'some/project/web-dev-server.config.js': '{}',
                'some/project/project.json': '{}',
              },
              options: {},
            });

            expect(nodes).toContainEqual([
              'some/project/web-dev-server.config.js',
              expect.objectContaining({
                projects: {
                  ['some/project']: {
                    targets: {
                      serve: expect.anything(),
                    },
                  },
                },
              }),
            ]);
          });
        });

        describe('serveTargetConfig', () => {
          it('should serve in watch mode when not overriden', async () => {
            const nodes = await runCreateNodesV2({
              directories: {
                'some/project/web-dev-server.config.js': '{}',
                'some/project/project.json': '{}',
              },
              options: {},
            });

            expect(nodes).toContainEqual([
              'some/project/web-dev-server.config.js',
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
            ]);
          });

          it('should allow to override the default target configuration', async () => {
            const nodes = await runCreateNodesV2({
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

            expect(nodes).toContainEqual([
              'some/project/web-dev-server.config.js',
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
            ]);
          });
        });
      });
    });
  });
});
