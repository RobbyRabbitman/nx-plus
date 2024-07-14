import {
  createNodesFromFiles,
  CreateNodesFunction,
  CreateNodesV2,
  readJsonFile,
  TargetConfiguration,
  targetToTargetString,
} from '@nx/devkit';
import { existsSync } from 'fs';
import { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';
import { dirname, join } from 'path';
import {
  createVersionMatrix,
  E2eProjectWithNx,
  E2eProjectWithNxPermutation,
} from '../nx-version-matrix';

export type E2eVersionMatrixTargetPluginOptions = {
  e2eTargetName?: string;
  e2eVersionMatrixTargetName?: string;
  peerDependencyEnvPrefix?: string;
  configurationPrefix?: string;
  configurationConfig?: TargetConfiguration<Partial<RunCommandsOptions>>;
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
  const {
    e2eVersionMatrixTargetName,
    e2eTargetName,
    peerDependencyEnvPrefix,
    configurationPrefix,
    configurationConfig,
  } = {
    e2eVersionMatrixTargetName: 'e2e-version-matrix',
    e2eTargetName: 'e2e',
    peerDependencyEnvPrefix: 'E2E_PEER_DEPENDENCY_',
    configurationPrefix: 'version-matrix',
    configurationConfig: {},
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
    ...configurationConfig,
    env: {
      ...Object.fromEntries(
        Object.entries(peerDependencies).map(([name, version]) => [
          `${peerDependencyEnvPrefix}${name}`,
          version,
        ]),
      ),
      ...configurationConfig['env'],
    },
  });

  const configurations = Object.fromEntries(
    e2eVersionMatrix.map((permutation) => [
      getConfigurationName(permutation),
      createConfiguration(permutation),
    ]),
  );

  const e2eVersionMatrixTarget = () => {
    const buildCommand = (configuration: string) =>
      ({
        command: `nx run ${targetToTargetString({
          project: '{projectName}',
          target: e2eTargetName,
          configuration,
        })}`,
      }) satisfies RunCommandsOptions['commands'][0];

    const commands = Object.keys(configurations).map(buildCommand);

    return {
      executor: 'nx:run-commands',
      options: {
        commands,
        parallel: false,
      },
    } satisfies TargetConfiguration<Partial<RunCommandsOptions>>;
  };

  return {
    projects: {
      [projectRoot]: {
        targets: {
          [e2eTargetName]: {
            configurations,
          },
          [e2eVersionMatrixTargetName]: e2eVersionMatrixTarget(),
        },
      },
    },
  };
};

export function readPeerDependencies({
  peerDependencyEnvPrefix,
}: {
  peerDependencyEnvPrefix: string;
}) {
  const peerDependencyEnvVars = Object.keys(process.env).filter((x) =>
    x.startsWith(peerDependencyEnvPrefix),
  );

  const peerDependencies = Object.fromEntries(
    peerDependencyEnvVars.map((envVar) => [
      envVar.replace(peerDependencyEnvPrefix, ''),
      process.env[envVar],
    ]),
  ) as E2eProjectWithNxPermutation['peerDependencies'];

  if (!('nx' in peerDependencies)) {
    throw new Error('nx not in peer dependencies!');
  }

  return peerDependencies;
}
