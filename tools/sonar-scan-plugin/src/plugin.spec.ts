import { type CreateNodesContextV2, type CreateNodesResult } from '@nx/devkit';
import { type DirectoryJSON, vol } from 'memfs';
import { minimatch } from 'minimatch';
import { createNodesV2, type SonarScanPluginSchema } from './plugin.js';

vi.mock('fs', async () => {
  const memfs = await vi.importActual<typeof import('memfs')>('memfs');

  return memfs.fs;
});

describe('[Unit Test] createSonarScanTarget', () => {
  async function runCreateNodes(options: {
    directories: DirectoryJSON;
    context?: CreateNodesContextV2;
    schema?: SonarScanPluginSchema;
  }) {
    const [createNodesGlob, createNodesFn] = createNodesV2;

    const { directories, schema } = options;

    const context = {
      nxJsonConfiguration: {},
      workspaceRoot: '',
      ...options.context,
    } satisfies CreateNodesContextV2;

    vol.fromJSON(directories, context.workspaceRoot);

    return createNodesFn(
      Object.keys(directories).filter((file) =>
        minimatch(file, createNodesGlob, { dot: true }),
      ),
      schema,
      context,
    );
  }

  afterEach(() => {
    vol.reset();
  });

  it('should infer "sonar-project.properties" files', async () => {
    const nodes = await runCreateNodes({
      directories: {
        'sonar-project.properties': '',
        'project-1/sonar-project.properties': '',
        'nested/project-2/sonar-project.properties': '',
      },
    });

    expect(nodes).toEqual([
      ['sonar-project.properties', expect.anything()],
      ['project-1/sonar-project.properties', expect.anything()],
      ['nested/project-2/sonar-project.properties', expect.anything()],
    ]);
  });

  it('should add a target in the directory of the "sonar-project.properties" file', async () => {
    const nodes = await runCreateNodes({
      directories: {
        'sonar-project.properties': '',
      },
    });

    expect(nodes).toEqual([
      [
        'sonar-project.properties',
        {
          projects: {
            '.': expect.objectContaining({
              targets: expect.objectContaining({
                'sonar-scan': expect.anything(),
              }),
            }),
          },
        } satisfies CreateNodesResult,
      ],
    ]);
  });

  describe('the created nodes of the inferred "sonar-project.properties" file', () => {
    describe('should have a sonar scan target', () => {
      it('', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'sonar-project.properties': '',
          },
        });

        expect(nodes).toEqual([
          [
            'sonar-project.properties',
            {
              projects: {
                '.': {
                  targets: {
                    'sonar-scan': {
                      command:
                        'pnpm exec nx run tools-sonar:exec-sonar-scan-cli',
                      options: {
                        projectName: '{projectName}',
                      },
                    },
                  },
                },
              },
            } satisfies CreateNodesResult,
          ],
        ]);
      });

      describe('when it is a npm project', () => {
        it('should pass "js" as a project technology to the sonar scan target', async () => {
          const nodes = await runCreateNodes({
            directories: {
              'package.json': '',
              'sonar-project.properties': '',
            },
          });

          expect(nodes).toEqual([
            [
              'sonar-project.properties',
              {
                projects: {
                  '.': {
                    targets: {
                      'sonar-scan': {
                        command:
                          'pnpm exec nx run tools-sonar:exec-sonar-scan-cli',
                        options: {
                          projectName: '{projectName}',
                          projectTechnology: 'js',
                        },
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

  describe('schema', () => {
    describe('sonarScanTargetName', () => {
      it('should use the provided value', async () => {
        const sonarScanTargetName = 'my-sonar-scan';

        const nodes = await runCreateNodes({
          directories: {
            'sonar-project.properties': '',
          },
          schema: {
            sonarScanTargetName,
          },
        });

        expect(nodes).toEqual([
          [
            'sonar-project.properties',
            {
              projects: {
                '.': {
                  targets: {
                    [sonarScanTargetName]: expect.anything(),
                  },
                },
              },
            },
          ],
        ]);
      });

      it('should fall back to `sonar-scan` when the provided value is an empty string', async () => {
        const sonarScanTargetName = '';

        const nodes = await runCreateNodes({
          directories: {
            'sonar-project.properties': '',
          },
          schema: {
            sonarScanTargetName,
          },
        });

        expect(nodes).toEqual([
          [
            'sonar-project.properties',
            {
              projects: {
                '.': {
                  targets: {
                    'sonar-scan': expect.anything(),
                  },
                },
              },
            },
          ],
        ]);
      });

      it('should fall back to `sonar-scan` when the value is not provided', async () => {
        const sonarScanTargetName = '';

        const nodes = await runCreateNodes({
          directories: {
            'sonar-project.properties': '',
          },
          schema: {
            sonarScanTargetName,
          },
        });

        expect(nodes).toEqual([
          [
            'sonar-project.properties',
            {
              projects: {
                '.': {
                  targets: {
                    'sonar-scan': expect.anything(),
                  },
                },
              },
            },
          ],
        ]);
      });
    });

    describe('sonarScanTargetConfiguration', () => {
      it('should allow to override the default target configuration', async () => {
        const nodes = await runCreateNodes({
          directories: {
            'sonar-project.properties': '',
          },
          schema: {
            sonarScanTargetConfiguration: {
              command: 'my-custom-command',
            },
          },
        });

        expect(nodes).toEqual([
          [
            'sonar-project.properties',
            {
              projects: {
                '.': {
                  targets: {
                    'sonar-scan': {
                      command: 'my-custom-command',
                      options: {
                        projectName: '{projectName}',
                      },
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
