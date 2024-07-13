import {
  createNodesFromFiles,
  CreateNodesFunction,
  CreateNodesV2,
  readJsonFile,
} from '@nx/devkit';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import {
  createVersionMatrix,
  E2eProjectWithNx,
  E2eProjectWithNxPermutation,
} from '../nx-version-matrix';

export type E2eVersionMatrixTargetPluginOptions = {
  targetName?: string;
  peerDependencyEnvPrefix?: string;
  configurationPrefix?: string;
};

const e2eVersionMatrixConfigGlob = '**/e2e-version-matrix.config.json';

export const createNodesV2: CreateNodesV2<E2eVersionMatrixTargetPluginOptions> =
  [
    e2eVersionMatrixConfigGlob,
    (e2eVersionMatrixConfigPath, options, context) => {
      return createNodesFromFiles(
        addE2eVersionMatrix,
        e2eVersionMatrixConfigPath,
        options,
        context,
      );
    },
  ];

const addE2eVersionMatrix: CreateNodesFunction<
  E2eVersionMatrixTargetPluginOptions
> = (e2eVersionMatrixConfigPath, options, context) => {
  const { targetName, peerDependencyEnvPrefix, configurationPrefix } = {
    targetName: 'e2e',
    peerDependencyEnvPrefix: 'E2E_PEER_DEPENDENCY_',
    configurationPrefix: 'version-matrix',
    ...options,
  } satisfies Required<E2eVersionMatrixTargetPluginOptions>;

  const maybeProjectRoot = dirname(e2eVersionMatrixConfigPath);

  if (
    !existsSync(
      join(context.workspaceRoot, maybeProjectRoot, 'project.json'),
    ) &&
    !existsSync(join(context.workspaceRoot, maybeProjectRoot, 'package.json'))
  ) {
    return {};
  }

  const projectRoot = maybeProjectRoot;

  const e2eVersionMatrixConfig = readJsonFile<E2eProjectWithNx>(
    e2eVersionMatrixConfigPath,
  );

  const e2eVersionMatrix = createVersionMatrix(e2eVersionMatrixConfig);

  const getConfigurationName = ({
    peerDependencies: { nx, ...peerDependencies },
  }: E2eProjectWithNxPermutation) =>
    [
      configurationPrefix,
      `nx@${nx}`,
      ...Object.entries(peerDependencies).map((name_version) =>
        name_version.join('@'),
      ),
    ].join('---');

  const createConfiguration = ({
    peerDependencies,
  }: E2eProjectWithNxPermutation) => ({
    env: Object.fromEntries(
      Object.entries(peerDependencies).map(([name, version]) => [
        `${peerDependencyEnvPrefix}${name}`,
        version,
      ]),
    ),
  });

  const configurations = Object.fromEntries(
    e2eVersionMatrix.map((permutation) => [
      getConfigurationName(permutation),
      createConfiguration(permutation),
    ]),
  );

  return {
    projects: {
      [projectRoot]: {
        targets: {
          [targetName]: {
            configurations,
          },
        },
      },
    },
  };
};
