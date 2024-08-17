import {
  CreateNodesContextV2,
  ProjectConfiguration,
  readCachedProjectGraph,
  workspaceRoot,
} from '@nx/devkit';
import { DirectoryJSON, vol } from 'memfs';
import { minimatch } from 'minimatch';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import {
  createNodesV2,
  E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_ENV_PREFIX,
  E2eVersionMatrixPluginSchema,
  getE2eVersionMatrixProject,
} from './e2e-version-matrix';
import { VersionMatrixConfig } from './version-matrix';

vi.mock('fs', async () => {
  const { fs } = await vi.importActual<typeof import('memfs')>('memfs');

  return fs;
});

vi.mock('@nx/devkit', async (actualModule) => {
  const devkit = await actualModule<typeof import('@nx/devkit')>();

  return {
    ...devkit,
    readCachedProjectGraph: vi.fn(),
  };
});

describe('e2e version matrix', () => {
  const runCreateNodesV2 = async ({
    directories,
    schema,
  }: {
    directories: DirectoryJSON;
    schema?: E2eVersionMatrixPluginSchema;
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

  describe('with a `e2e-version-matrix.config.json` in the workspace root', () => {
    it('should not modify the project graph', async () => {
      const nodes = await runCreateNodesV2({
        directories: {
          'package.json': '{}',
          'project.json': '{}',
          'e2e-version-matrix.config.json': '{}',
        },
      });

      expect(nodes).toContainEqual(['e2e-version-matrix.config.json', {}]);
    });
  });

  describe('with a `e2e-version-matrix.config.json` in a directory of the workspace', () => {
    it('should not modify the project graph by default', async () => {
      const nodes = await runCreateNodesV2({
        directories: {
          'some/directory/e2e-version-matrix.config.json': '{}',
        },
      });

      expect(nodes).toContainEqual([
        'some/directory/e2e-version-matrix.config.json',
        {},
      ]);
    });

    describe('with a `project.json` or `package.json`', () => {
      it('should add a version matrix target that depends on the permutation targets', async () => {
        const versionMatrixConfig = {
          name: 'some-project',
          version: 'local',
          peerDependencies: {
            foo: ['1', '2'],
            bar: ['2'],
          },
        } satisfies VersionMatrixConfig;

        const nodes = await runCreateNodesV2({
          directories: {
            // some project with a project.json + version matrix config
            'some-project/e2e-version-matrix.config.json':
              JSON.stringify(versionMatrixConfig),
            'some-project/project.json': '{}',
            // some other project with a package.json + version matrix config
            'some-other-project/e2e-version-matrix.config.json':
              JSON.stringify(versionMatrixConfig),
            'some-other-project/package.json': '{}',
          },
        });

        const expectedProjectConfig = {
          targets: {
            'e2e-version-matrix-permutation---foo@1---bar@2': expect.anything(),
            'e2e-version-matrix-permutation---foo@2---bar@2': expect.anything(),
            'e2e-version-matrix': {
              inputs: [
                {
                  externalDependencies: ['foo', 'bar'],
                },
              ],
              dependsOn: [
                'e2e-version-matrix-permutation---foo@1---bar@2',
                'e2e-version-matrix-permutation---foo@2---bar@2',
              ],
            },
          },
        } satisfies Partial<ProjectConfiguration>;

        expect(nodes).toEqual([
          [
            'some-project/e2e-version-matrix.config.json',
            {
              projects: {
                'some-project': expectedProjectConfig,
              },
            },
          ],
          [
            'some-other-project/e2e-version-matrix.config.json',
            {
              projects: {
                'some-other-project': expectedProjectConfig,
              },
            },
          ],
        ]);
      });

      it('should add the permuation targets', async () => {
        const versionMatrixConfig = {
          name: 'some-project',
          version: 'local',
          peerDependencies: {
            foo: ['1', '2'],
            bar: ['3', '4'],
          },
        } satisfies VersionMatrixConfig;

        const nodes = await runCreateNodesV2({
          directories: {
            // some project with a project.json + version matrix config
            'some-project/e2e-version-matrix.config.json':
              JSON.stringify(versionMatrixConfig),
            'some-project/project.json': '{}',
            // some other project with a package.json + version matrix config
            'some-other-project/e2e-version-matrix.config.json':
              JSON.stringify(versionMatrixConfig),
            'some-other-project/package.json': '{}',
          },
        });

        const expectedProjectConfig = {
          targets: {
            'e2e-version-matrix-permutation---foo@1---bar@3': {
              inputs: [
                {
                  externalDependencies: ['foo', 'bar'],
                },
                {
                  env: 'E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_foo',
                },
                {
                  env: 'E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_bar',
                },
              ],
              options: {
                env: {
                  E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_foo: '1',
                  E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_bar: '3',
                },
              },
            },
            'e2e-version-matrix-permutation---foo@1---bar@4': {
              inputs: [
                {
                  externalDependencies: ['foo', 'bar'],
                },
                {
                  env: 'E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_foo',
                },
                {
                  env: 'E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_bar',
                },
              ],
              options: {
                env: {
                  E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_foo: '1',
                  E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_bar: '4',
                },
              },
            },
            'e2e-version-matrix-permutation---foo@2---bar@3': {
              inputs: [
                {
                  externalDependencies: ['foo', 'bar'],
                },
                {
                  env: 'E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_foo',
                },
                {
                  env: 'E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_bar',
                },
              ],
              options: {
                env: {
                  E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_foo: '2',
                  E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_bar: '3',
                },
              },
            },
            'e2e-version-matrix-permutation---foo@2---bar@4': {
              inputs: [
                {
                  externalDependencies: ['foo', 'bar'],
                },
                {
                  env: 'E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_foo',
                },
                {
                  env: 'E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_bar',
                },
              ],
              options: {
                env: {
                  E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_foo: '2',
                  E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_bar: '4',
                },
              },
            },
            'e2e-version-matrix': expect.anything(),
          },
        } satisfies Partial<ProjectConfiguration>;

        expect(nodes).toEqual([
          [
            'some-project/e2e-version-matrix.config.json',
            {
              projects: {
                'some-project': expectedProjectConfig,
              },
            },
          ],
          [
            'some-other-project/e2e-version-matrix.config.json',
            {
              projects: {
                'some-other-project': expectedProjectConfig,
              },
            },
          ],
        ]);
      });
    });

    describe('schema', () => {
      describe('targetName', () => {
        it('should use the provided targetName for the version matrix target', async () => {
          const versionMatrixConfig = {
            name: 'some-project',
            version: 'local',
            peerDependencies: {
              foo: ['1', '2'],
              bar: ['2'],
            },
          } satisfies VersionMatrixConfig;

          const nodes = await runCreateNodesV2({
            directories: {
              'some-project/e2e-version-matrix.config.json':
                JSON.stringify(versionMatrixConfig),
              'some-project/project.json': '{}',
            },
            schema: {
              targetName: 'my-e2e-version-matrix',
            },
          });

          expect(nodes).toEqual([
            [
              'some-project/e2e-version-matrix.config.json',
              {
                projects: {
                  'some-project': {
                    targets: {
                      'e2e-version-matrix-permutation---foo@1---bar@2':
                        expect.anything(),
                      'e2e-version-matrix-permutation---foo@2---bar@2':
                        expect.anything(),
                      'my-e2e-version-matrix': {
                        inputs: [
                          {
                            externalDependencies: ['foo', 'bar'],
                          },
                        ],
                        dependsOn: [
                          'e2e-version-matrix-permutation---foo@1---bar@2',
                          'e2e-version-matrix-permutation---foo@2---bar@2',
                        ],
                      },
                    },
                  },
                },
              },
            ],
          ]);
        });
      });

      describe('targetConfiguration', () => {
        it('should merge the provided targetConfiguration for the version matrix target', async () => {
          const versionMatrixConfig = {
            name: 'some-project',
            version: 'local',
            peerDependencies: {
              foo: ['1', '2'],
              bar: ['2'],
            },
          } satisfies VersionMatrixConfig;

          const nodes = await runCreateNodesV2({
            directories: {
              'some-project/e2e-version-matrix.config.json':
                JSON.stringify(versionMatrixConfig),
              'some-project/project.json': '{}',
            },
            schema: {
              targetConfiguration: {
                inputs: ['some-input'],
                dependsOn: ['some-dependency'],
                options: {
                  foo: '1',
                },
              },
            },
          });

          expect(nodes).toEqual([
            [
              'some-project/e2e-version-matrix.config.json',
              {
                projects: {
                  'some-project': {
                    targets: {
                      'e2e-version-matrix-permutation---foo@1---bar@2':
                        expect.anything(),
                      'e2e-version-matrix-permutation---foo@2---bar@2':
                        expect.anything(),
                      'e2e-version-matrix': {
                        inputs: [
                          {
                            externalDependencies: ['foo', 'bar'],
                          },
                          'some-input',
                        ],
                        dependsOn: [
                          'e2e-version-matrix-permutation---foo@1---bar@2',
                          'e2e-version-matrix-permutation---foo@2---bar@2',
                          'some-dependency',
                        ],
                        options: {
                          foo: '1',
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
      describe('permutationTargetPrefix', () => {
        it('should use the provided permutationTargetPrefix for the permutation targets', async () => {
          const versionMatrixConfig = {
            name: 'some-project',
            version: 'local',
            peerDependencies: {
              foo: ['1', '2'],
              bar: ['2'],
            },
          } satisfies VersionMatrixConfig;

          const nodes = await runCreateNodesV2({
            directories: {
              'some-project/e2e-version-matrix.config.json':
                JSON.stringify(versionMatrixConfig),
              'some-project/project.json': '{}',
            },
            schema: {
              permutationTargetPrefix: 'my-e2e-version-matrix-permutation',
            },
          });

          expect(nodes).toEqual([
            [
              'some-project/e2e-version-matrix.config.json',
              {
                projects: {
                  'some-project': {
                    targets: {
                      'my-e2e-version-matrix-permutation---foo@1---bar@2':
                        expect.anything(),
                      'my-e2e-version-matrix-permutation---foo@2---bar@2':
                        expect.anything(),
                      'e2e-version-matrix': expect.anything(),
                    },
                  },
                },
              },
            ],
          ]);
        });
      });
      describe('permutationTargetConfiguration', () => {
        it('should merge the provided permutationTargetConfiguration for the permutation targets', async () => {
          const versionMatrixConfig = {
            name: 'some-project',
            version: 'local',
            peerDependencies: {
              foo: ['1', '2'],
              bar: ['2'],
            },
          } satisfies VersionMatrixConfig;

          const nodes = await runCreateNodesV2({
            directories: {
              'some-project/e2e-version-matrix.config.json':
                JSON.stringify(versionMatrixConfig),
              'some-project/project.json': '{}',
            },
            schema: {
              permutationTargetConfiguration: {
                inputs: ['some-input'],
                dependsOn: ['some-dependency'],
                options: {
                  'some-option': 'some-option-value',
                  env: {
                    'some-env': 'some-env-value',
                  },
                },
              },
            },
          });

          expect(nodes).toEqual([
            [
              'some-project/e2e-version-matrix.config.json',
              {
                projects: {
                  'some-project': {
                    targets: {
                      'e2e-version-matrix-permutation---foo@1---bar@2': {
                        dependsOn: ['some-dependency'],
                        inputs: [
                          {
                            externalDependencies: ['foo', 'bar'],
                          },
                          {
                            env: 'E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_foo',
                          },
                          {
                            env: 'E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_bar',
                          },
                          'some-input',
                        ],
                        options: {
                          'some-option': 'some-option-value',
                          env: {
                            'some-env': 'some-env-value',
                            E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_foo: '1',
                            E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_bar: '2',
                          },
                        },
                      },
                      'e2e-version-matrix-permutation---foo@2---bar@2': {
                        dependsOn: ['some-dependency'],
                        inputs: [
                          {
                            externalDependencies: ['foo', 'bar'],
                          },
                          {
                            env: 'E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_foo',
                          },
                          {
                            env: 'E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_bar',
                          },
                          'some-input',
                        ],
                        options: {
                          'some-option': 'some-option-value',
                          env: {
                            'some-env': 'some-env-value',
                            E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_foo: '2',
                            E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_bar: '2',
                          },
                        },
                      },
                      'e2e-version-matrix': expect.anything(),
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

  describe('getE2eVersionMatrixProject', async () => {
    beforeEach(() => {
      const versionMatrixConfig = {
        name: 'some-project',
        version: 'local',
        peerDependencies: {
          foo: ['1', '2'],
          bar: ['2'],
        },
      } satisfies VersionMatrixConfig;

      vol.fromJSON({
        [join(workspaceRoot, 'some/project/e2e-version-matrix.config.json')]:
          JSON.stringify(versionMatrixConfig),
      });

      vi.stubEnv('NX_TASK_TARGET_PROJECT', 'some-project');
      vi.stubEnv('NX_TASK_TARGET_TARGET', 'some-target');

      (readCachedProjectGraph as Mock).mockReturnValue({
        dependencies: {},
        nodes: {
          'some-project': {
            name: 'some-project',
            type: 'lib',
            data: {
              root: 'some/project',
            },
          },
        },
      });
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should return the project of the current target', async () => {
      vi.stubEnv(
        `${E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_ENV_PREFIX}_foo`,
        '1',
      );
      vi.stubEnv(
        `${E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_ENV_PREFIX}_bar`,
        '2',
      );
      expect(getE2eVersionMatrixProject()).toEqual({
        e2ePackage: {
          name: 'some-project',
          version: 'local',
          peerDependencies: {
            foo: '1',
            bar: '2',
          },
        },
        e2eWorkspaceName: expect.stringMatching(/some-target/),
      });

      vi.stubEnv(
        `${E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_ENV_PREFIX}_foo`,
        '2',
      );
      vi.stubEnv(
        `${E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_ENV_PREFIX}_bar`,
        '2',
      );
      expect(getE2eVersionMatrixProject()).toEqual({
        e2ePackage: {
          name: 'some-project',
          version: 'local',
          peerDependencies: {
            foo: '2',
            bar: '2',
          },
        },
        e2eWorkspaceName: expect.stringMatching(/some-target/),
      });
    });
  });
});
