import type { CreateNodesContextV2, CreateNodesResult } from '@nx/devkit';
import { type DirectoryJSON, vol } from 'memfs';
import { minimatch } from 'minimatch';
import { createNodesV2 } from './plugin';

vi.mock('fs', async () => {
  const memfs = await vi.importActual<typeof import('memfs')>('memfs');

  return memfs.fs;
});

describe('[Unit Test] createSchemaToTsTarget', () => {
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

  afterEach(() => {
    vol.reset();
  });

  describe('a json schema file without a project', () => {
    describe('should not modify the project graph', () => {
      it('when placed outside a source folder', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'some/path/to/my.schema.json': '{}',
          },
        });

        expect(nodes).toEqual([]);
      });

      it('when placed inside a source folder', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'some/project/src/lib/my.schema.json': '{}',
          },
        });

        expect(nodes).toEqual([
          [
            'some/project/src/lib/my.schema.json',
            {} satisfies CreateNodesResult,
          ],
        ]);
      });
    });
  });

  describe('a json schema file in the source folder of a project', () => {
    it('should infer a `schema to ts` target to the project node', async () => {
      const nodes = await runCreateNodes({
        directories: {
          'some/project/src/lib/my.schema.json': '{}',
          'some/project/package.json': '{}',
        },
      });

      expect(nodes).toEqual([
        [
          'some/project/src/lib/my.schema.json',
          {
            projects: {
              'some/project': {
                targets: {
                  'pre-build--src__lib__my.schema.json': expect.anything(),
                },
              },
            },
          } satisfies CreateNodesResult,
        ],
      ]);
    });

    it('should add a `schema to ts` target to the project node', async () => {
      const nodes = await runCreateNodes({
        directories: {
          'some/project/src/lib/my.schema.json': '{}',
          'some/project/package.json': '{}',
        },
      });

      expect(nodes).toEqual([
        [
          'some/project/src/lib/my.schema.json',
          {
            projects: {
              'some/project': {
                targets: {
                  'pre-build--src__lib__my.schema.json': {
                    cache: true,
                    command: 'json2ts',
                    inputs: ['{projectRoot}/src/lib/my.schema.json'],
                    options: {
                      cwd: '{projectRoot}',
                      input: 'src/lib/my.schema.json',
                      output: 'src/lib/my.schema.ts',
                    },
                    outputs: ['{projectRoot}/src/lib/my.schema.ts'],
                  },
                },
              },
            },
          } satisfies CreateNodesResult,
        ],
      ]);
    });
  });

  describe('schema', () => {
    describe('schemaToTsTargetName', () => {
      it('should use the provided value', async () => {
        const schemaToTsTargetName = 'my-custom-target-name';

        const nodes = await runCreateNodes({
          directories: {
            'some/project/src/lib/my.schema.json': '{}',
            'some/project/package.json': '{}',
          },
          options: {
            schemaToTsTargetName,
          },
        });

        expect(nodes).toEqual([
          [
            'some/project/src/lib/my.schema.json',
            {
              projects: {
                'some/project': {
                  targets: {
                    'my-custom-target-name--src__lib__my.schema.json':
                      expect.anything(),
                  },
                },
              },
            } satisfies CreateNodesResult,
          ],
        ]);
      });

      it('should fall back to `pre-build` when the provided value is an empty string', async () => {
        const schemaToTsTargetName = '';

        const nodes = await runCreateNodes({
          directories: {
            'some/project/src/lib/my.schema.json': '{}',
            'some/project/package.json': '{}',
          },
          options: {
            schemaToTsTargetName,
          },
        });

        expect(nodes).toEqual([
          [
            'some/project/src/lib/my.schema.json',
            {
              projects: {
                'some/project': {
                  targets: {
                    'pre-build--src__lib__my.schema.json': expect.anything(),
                  },
                },
              },
            } satisfies CreateNodesResult,
          ],
        ]);
      });

      it('should fall back to `pre-build` when the value is not provided', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'some/project/src/lib/my.schema.json': '{}',
            'some/project/package.json': '{}',
          },
          options: {},
        });

        expect(nodes).toEqual([
          [
            'some/project/src/lib/my.schema.json',
            {
              projects: {
                'some/project': {
                  targets: {
                    'pre-build--src__lib__my.schema.json': expect.anything(),
                  },
                },
              },
            } satisfies CreateNodesResult,
          ],
        ]);
      });
    });

    describe('schemaToTsTargetConfiguration', () => {
      it('should set the default target configuration', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'some/project/src/lib/my.schema.json': '{}',
            'some/project/package.json': '{}',
          },
          options: {
            schemaToTsTargetConfiguration: {
              /**
               * Make sure options are merged, user provided options should have
               * priority over default options.
               */
              options: {
                input: 'some/input',
                someNewOption: 'some-new-option',
              },
              /** Make sure new options are added. */
              dependsOn: ['some-target'],
            },
          },
        });

        expect(nodes).toEqual([
          [
            'some/project/src/lib/my.schema.json',
            {
              projects: {
                'some/project': {
                  targets: {
                    'pre-build--src__lib__my.schema.json': {
                      cache: true,
                      command: 'json2ts',
                      inputs: ['{projectRoot}/src/lib/my.schema.json'],
                      options: {
                        cwd: '{projectRoot}',
                        input: 'some/input',
                        output: 'src/lib/my.schema.ts',
                        someNewOption: 'some-new-option',
                      },
                      outputs: ['{projectRoot}/src/lib/my.schema.ts'],
                      dependsOn: ['some-target'],
                    },
                  },
                },
              },
            } satisfies CreateNodesResult,
          ],
        ]);
      });
    });
  });
});
