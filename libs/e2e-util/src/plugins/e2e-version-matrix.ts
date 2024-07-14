import {
  createNodesFromFiles,
  CreateNodesFunction,
  CreateNodesV2,
  readJsonFile,
  TargetConfiguration,
  targetToTargetString,
  workspaceRoot,
} from '@nx/devkit';
import { existsSync } from 'fs';
import { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';
import { dirname, join } from 'path';
import {
  createVersionMatrix,
  VersionMatrixConfig,
  VersionMatrixItem,
} from '../version-matrix';

export type E2eVersionMatrixTargetPluginOptions = {
  e2eTargetName?: string;
  e2eVersionMatrixTargetName?: string;
  peerDependencyEnvPrefix?: string;
  configurationPrefix?: string;
  configurationConfig?: TargetConfiguration<Partial<RunCommandsOptions>>;
};

const e2eVersionMatrixConfigFileName = 'e2e-version-matrix.config.json';
const e2eVersionMatrixConfigGlob = `**/${e2eVersionMatrixConfigFileName}`;

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
    !existsSync(join(context.workspaceRoot, maybeProjectRoot, 'project.json'))
  ) {
    return {};
  }

  const projectRoot = maybeProjectRoot;

  let maybeE2eVersionMatrixConfig: VersionMatrixConfig;

  try {
    maybeE2eVersionMatrixConfig = readJsonFile<VersionMatrixConfig>(
      e2eVersionMatrixConfigPath,
    );
  } catch (error) {
    console.error(error);
    return {};
  }

  /**
   * TODO: maybe we can use the `peerDependencies` of the package.json as is and
   * find a logic to extract the _wanted_ versions. Or specify a strategy to
   * create the version map.
   */
  const e2eVersionMatrixConfig = maybeE2eVersionMatrixConfig;

  const e2eVersionMatrix = createVersionMatrix(e2eVersionMatrixConfig);

  const getConfigurationName = ({
    peerDependencies: { nx, ...peerDependencies },
  }: VersionMatrixItem) =>
    [
      configurationPrefix,
      `nx@${nx}`,
      ...Object.entries(peerDependencies).map((name_version) =>
        name_version.join('@'),
      ),
    ].join('---');

  const createConfiguration = ({ peerDependencies }: VersionMatrixItem) => ({
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
    const runE2eTarget = (configuration: string) => {
      const e2eTarget = targetToTargetString({
        project: '{projectName}',
        target: e2eTargetName,
        configuration,
      });
      return {
        command: `nx run ${e2eTarget}`,
      } satisfies RunCommandsOptions['commands'][0];
    };

    const commands = Object.keys(configurations).map(runE2eTarget);

    return {
      executor: 'nx:run-commands',
      options: {
        commands,
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

export function readE2eProject({
  peerDependencyEnvPrefix,
}: {
  peerDependencyEnvPrefix: string;
}) {
  const peerDependencyEnvVars = Object.keys(process.env).filter((envVar) =>
    envVar.startsWith(peerDependencyEnvPrefix),
  );

  const projectName = process.env['NX_TASK_TARGET_PROJECT'];
  const configuration = process.env['NX_TASK_TARGET_CONFIGURATION'];
  const project = readCachedProjectConfiguration(projectName);

  const e2eVersionMatrixConfig = readJsonFile<VersionMatrixConfig>(
    join(workspaceRoot, project.root, e2eVersionMatrixConfigFileName),
  );

  const peerDependencies = Object.fromEntries(
    peerDependencyEnvVars.map((envVar) => [
      envVar.replace(peerDependencyEnvPrefix, ''),
      process.env[envVar],
    ]),
  ) as VersionMatrixItem['peerDependencies'];

  if (!('nx' in peerDependencies)) {
    throw new Error('nx not in peer dependencies!');
  }

  return {
    e2eNxWorkspaceName: `${Date.now()}${configuration}`
      .replace(/[^a-z0-9]/gi, '')
      .substring(0, 255),
    e2ePackage: {
      name: e2eVersionMatrixConfig.name,
      version: e2eVersionMatrixConfig.version,
      peerDependencies,
    } satisfies VersionMatrixItem,
  };
}
