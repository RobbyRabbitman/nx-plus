import type { CreateNodesContextV2 } from '@nx/devkit';
import { type DirectoryJSON, vol } from 'memfs';
import { minimatch } from 'minimatch';
import { createNodesV2 } from './web-dev-server.plugin.js';

vi.mock('fs', async () => {
  const memfs = await vi.importActual<typeof import('memfs')>('memfs');
  return memfs.fs;
});

describe('[Unit Test] createWebDevServerTarget', () => {
  const [createNodesGlob, createNodesFn] = createNodesV2;

  async function runCreateNodes(args: {
    directories: DirectoryJSON;
    context?: CreateNodesContextV2;
    options?: Parameters<typeof createNodesFn>[1];
  }) {
    const { directories, options } = args;

    const context = {
      nxJsonConfiguration: {},
      workspaceRoot: '',
      ...args.context,
    } satisfies CreateNodesContextV2;

    vol.fromJSON(directories, context.workspaceRoot);

    return createNodesFn(
      Object.keys(directories).filter((file) =>
        minimatch(file, createNodesGlob, { dot: true }),
      ),
      options,
      context,
    );
  }

  beforeEach(() => {
    vol.reset();
  });

  describe('a `Web Dev Server` config in a directory of the workspace', () => {
    it('should not modify the project graph by default', async () => {
      const nodes = await runCreateNodes({
        directories: {
          'some/directory/web-dev-server.config.js': '{}',
        },
      });

      expect(nodes).toContainEqual([
        'some/directory/web-dev-server.config.js',
        {},
      ]);
    });

    describe('should add a `Web Dev Server` serve target', () => {
      it('when a `package.json` is present', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'some/project/web-dev-server.config.js': '{}',
            'some/project/package.json': '{}',
          },
        });

        expect(nodes).toContainEqual([
          'some/project/web-dev-server.config.js',
          expect.objectContaining({
            projects: {
              'some/project': {
                targets: {
                  serve: expect.anything(),
                },
              },
            },
          }),
        ]);
      });

      it('when a `project.json` is present', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'some/project/web-dev-server.config.js': '{}',
            'some/project/project.json': '{}',
          },
        });

        expect(nodes).toContainEqual([
          'some/project/web-dev-server.config.js',
          expect.objectContaining({
            projects: {
              'some/project': {
                targets: {
                  serve: expect.anything(),
                },
              },
            },
          }),
        ]);
      });
    });

    it('should run the web-dev-server in the root of the project pointing to the inferred config', async () => {
      const nodes = await runCreateNodes({
        directories: {
          'some/project/web-dev-server.config.js': '{}',
          'some/project/package.json': '{}',
        },
      });

      expect(nodes).toContainEqual([
        'some/project/web-dev-server.config.js',
        expect.objectContaining({
          projects: {
            'some/project': {
              targets: {
                serve: {
                  command: 'web-dev-server',
                  options: {
                    cwd: 'some/project',
                    config: 'web-dev-server.config.js',
                    watch: true,
                  },
                },
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

          const nodes = await runCreateNodes({
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
                'some/project': {
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

          const nodes = await runCreateNodes({
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
                'some/project': {
                  targets: {
                    serve: expect.anything(),
                  },
                },
              },
            }),
          ]);
        });

        it('should fall back to `serve` when the value is not provided', async () => {
          const nodes = await runCreateNodes({
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
                'some/project': {
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
          const nodes = await runCreateNodes({
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
                'some/project': {
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

          expect(nodes).toContainEqual([
            'some/project/web-dev-server.config.js',
            expect.objectContaining({
              projects: {
                'some/project': {
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
