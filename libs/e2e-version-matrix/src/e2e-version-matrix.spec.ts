import { CreateNodesContextV2 } from '@nx/devkit';
import { DirectoryJSON, vol } from 'memfs';
import { minimatch } from 'minimatch';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createNodesV2,
  E2eVersionMatrixPluginSchema,
} from './e2e-version-matrix';
import { VersionMatrixConfig } from './version-matrix';

vi.mock('fs', async () => {
  const { fs } = await vi.importActual<typeof import('memfs')>('memfs');

  return fs;
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

  it('should add a version matrix target that depends on the permutation targets', async () => {
    const result = await runCreateNodesV2({
      directories: {
        'some-project/e2e-version-matrix.config.json': JSON.stringify({
          name: 'some-project',
          version: 'local',
          peerDependencies: {
            foo: ['1', '2'],
            bar: ['2'],
          },
        } satisfies VersionMatrixConfig),
        'some-project/project.json': '{}',
      },
    });

    expect(result).toEqual([
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
                'e2e-version-matrix-version-matrix': {
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

  it('should add the permuation targets', async () => {
    const result = await runCreateNodesV2({
      directories: {
        'some-project/e2e-version-matrix.config.json': JSON.stringify({
          name: 'some-project',
          version: 'local',
          peerDependencies: {
            foo: ['1', '2'],
            bar: ['3', '4'],
          },
        } satisfies VersionMatrixConfig),
        'some-project/project.json': '{}',
      },
    });

    expect(result).toEqual([
      [
        'some-project/e2e-version-matrix.config.json',
        {
          projects: {
            'some-project': {
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
                'e2e-version-matrix-version-matrix': expect.anything(),
              },
            },
          },
        },
      ],
    ]);
  });
});
