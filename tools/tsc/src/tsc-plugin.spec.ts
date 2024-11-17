import {
  type CreateNodesContextV2,
  type ProjectConfiguration,
} from '@nx/devkit';
import { type DirectoryJSON, vol } from 'memfs';
import { minimatch } from 'minimatch';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNodesV2, type TscPluginSchema } from './tsc-plugin';

vi.mock('fs', async () => {
  const { fs } = await vi.importActual<typeof import('memfs')>('memfs');

  return fs;
});

describe('tsc plugin', () => {
  const runCreateNodesV2 = async ({
    directories,
    schema,
  }: {
    directories: DirectoryJSON;
    schema?: TscPluginSchema;
  }) => {
    const [createNodesV2Glob, createNodesV2Fn] = createNodesV2;

    const context = {
      nxJsonConfiguration: {},
      workspaceRoot: '',
    } satisfies CreateNodesContextV2;

    vol.fromJSON(directories, context.workspaceRoot);

    const files = Object.keys(directories).filter((file) =>
      minimatch(file, createNodesV2Glob, { dot: true }),
    );

    return createNodesV2Fn(files, schema, context);
  };

  afterEach(() => {
    vol.reset();
    vi.resetModules();
  });

  describe('with a `tsconfig.lib.json` in the workspace root', () => {
    it('should not modify the project graph', async () => {
      const nodes = await runCreateNodesV2({
        directories: {
          'package.json': '{}',
          'project.json': '{}',
          'tsconfig.lib.json': '{}',
        },
      });

      expect(nodes).toContainEqual(['tsconfig.lib.json', {}]);
    });
  });

  describe('with a `tsconfig.lib.json` in a directory of the workspace', () => {
    it('should not modify the project graph by default', async () => {
      const nodes = await runCreateNodesV2({
        directories: {
          'some/directory/tsconfig.lib.json': '{}',
        },
      });

      expect(nodes).toContainEqual(['some/directory/tsconfig.lib.json', {}]);
    });

    describe('with a `project.json` or `package.json`', () => {
      it('should add a build target', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            // some project with a project.json  version matrix config
            'some-project/tsconfig.lib.json': '{}',
            'some-project/project.json': '{}',
            // some other project with a package.json  version matrix config
            'some-other-project/tsconfig.lib.json': '{}',
            'some-other-project/package.json': '{}',
          },
        });

        const expectedProjectConfig = {
          targets: {
            build: expect.anything(),
          },
        } satisfies Partial<ProjectConfiguration>;

        expect(nodes).toEqual([
          [
            'some-project/tsconfig.lib.json',
            {
              projects: {
                'some-project': expectedProjectConfig,
              },
            },
          ],
          [
            'some-other-project/tsconfig.lib.json',
            {
              projects: {
                'some-other-project': expectedProjectConfig,
              },
            },
          ],
        ]);
      });

      it('should have a `@nx/js:tsc` build target', async () => {
        const nodes = await runCreateNodesV2({
          directories: {
            'some-project/tsconfig.lib.json': '{}',
            'some-project/project.json': '{}',
          },
        });

        expect(nodes).toEqual([
          [
            'some-project/tsconfig.lib.json',
            {
              projects: {
                'some-project': {
                  targets: {
                    build: {
                      cache: true,
                      dependsOn: ['^build'],
                      executor: '@nx/js:tsc',
                      inputs: ['default', '^default'],
                      options: {
                        main: '{projectRoot}/src/index.ts',
                        outputPath: 'dist/{projectRoot}',
                        tsConfig: 'some-project/tsconfig.lib.json',
                      },
                      outputs: ['{options.outputPath}'],
                    },
                  },
                },
              },
            },
          ],
        ]);
      });
    });

    describe('schema', () => {
      describe('tscTargetName', () => {
        it('should use the provided target name', async () => {
          const schema = {
            tscTargetName: 'some-target-name',
          } satisfies TscPluginSchema;

          const nodes = await runCreateNodesV2({
            directories: {
              'some-project/tsconfig.lib.json': '{}',
              'some-project/project.json': '{}',
            },
            schema,
          });

          expect(nodes).toEqual([
            [
              'some-project/tsconfig.lib.json',
              {
                projects: {
                  'some-project': {
                    targets: {
                      'some-target-name': expect.anything(),
                    },
                  },
                },
              },
            ],
          ]);
        });

        it('should use `build` when an emtpy string', async () => {
          const schema = {
            tscTargetName: '',
          } satisfies TscPluginSchema;

          const nodes = await runCreateNodesV2({
            directories: {
              'some-project/tsconfig.lib.json': '{}',
              'some-project/project.json': '{}',
            },
            schema,
          });

          expect(nodes).toEqual([
            [
              'some-project/tsconfig.lib.json',
              {
                projects: {
                  'some-project': {
                    targets: {
                      build: expect.anything(),
                    },
                  },
                },
              },
            ],
          ]);
        });
      });

      describe('tsConfigSuffix', () => {
        it('should be `lib` by default', async () => {
          const nodes = await runCreateNodesV2({
            directories: {
              'some-project/tsconfig.lib.json': '{}',
              'some-project/tsconfig.json': '{}',
              'some-project/tsconfig.spec.json': '{}',
              'some-project/project.json': '{}',
            },
          });

          expect(nodes).toEqual([
            [
              'some-project/tsconfig.lib.json',
              {
                projects: {
                  'some-project': {
                    targets: {
                      build: expect.anything(),
                    },
                  },
                },
              },
            ],
            ['some-project/tsconfig.json', {}],
            ['some-project/tsconfig.spec.json', {}],
          ]);
        });

        it('should not add a target when the suffix does not match', async () => {
          const schema = { tsConfigSuffix: '.app' } satisfies TscPluginSchema;

          const nodes = await runCreateNodesV2({
            directories: {
              'some-project/tsconfig.lib.json': '{}',
              'some-project/tsconfig.json': '{}',
              'some-project/tsconfig.spec.json': '{}',
              'some-project/project.json': '{}',
            },
            schema,
          });

          expect(nodes).toEqual([
            ['some-project/tsconfig.lib.json', {}],
            ['some-project/tsconfig.json', {}],
            ['some-project/tsconfig.spec.json', {}],
          ]);
        });

        describe('should add a target when the suffix matches', () => {
          it('`` => `tsconfig.json`', async () => {
            const schema = { tsConfigSuffix: '' } satisfies TscPluginSchema;

            const nodes = await runCreateNodesV2({
              directories: {
                'some-project/tsconfig.lib.json': '{}',
                'some-project/tsconfig.json': '{}',
                'some-project/tsconfig.spec.json': '{}',
                'some-project/project.json': '{}',
              },
              schema,
            });

            expect(nodes).toEqual([
              ['some-project/tsconfig.lib.json', {}],
              [
                'some-project/tsconfig.json',
                {
                  projects: {
                    'some-project': {
                      targets: {
                        build: expect.anything(),
                      },
                    },
                  },
                },
              ],
              ['some-project/tsconfig.spec.json', {}],
            ]);
          });

          it('`.app` => `tsconfig.app.json`', async () => {
            const schema = { tsConfigSuffix: '.app' } satisfies TscPluginSchema;

            const nodes = await runCreateNodesV2({
              directories: {
                'some-project/tsconfig.lib.json': '{}',
                'some-project/tsconfig.json': '{}',
                'some-project/tsconfig.spec.json': '{}',
                'some-project/tsconfig.app.json': '{}',
                'some-project/project.json': '{}',
              },
              schema,
            });

            expect(nodes).toEqual([
              ['some-project/tsconfig.lib.json', {}],
              ['some-project/tsconfig.json', {}],
              ['some-project/tsconfig.spec.json', {}],
              [
                'some-project/tsconfig.app.json',
                {
                  projects: {
                    'some-project': {
                      targets: {
                        build: expect.anything(),
                      },
                    },
                  },
                },
              ],
            ]);
          });
        });
      });

      describe('tscTargetConfig', () => {
        it('should define the target configuration', async () => {
          const schema = {
            tscTargetConfig: {
              cache: false,
              dependsOn: ['foo'],
              options: {
                main: '{projectRoot}/src/main.ts',
              },
            },
          } satisfies TscPluginSchema;

          const nodes = await runCreateNodesV2({
            directories: {
              'some-project/tsconfig.lib.json': '{}',
              'some-project/project.json': '{}',
            },
            schema,
          });

          expect(nodes).toEqual([
            [
              'some-project/tsconfig.lib.json',
              {
                projects: {
                  'some-project': {
                    targets: {
                      build: {
                        cache: false,
                        dependsOn: ['foo'],
                        executor: '@nx/js:tsc',
                        inputs: ['default', '^default'],
                        options: {
                          main: '{projectRoot}/src/main.ts',
                          outputPath: 'dist/{projectRoot}',
                          tsConfig: 'some-project/tsconfig.lib.json',
                        },
                        outputs: ['{options.outputPath}'],
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
});
