import {
  createNodesFromFiles,
  CreateNodesFunction,
  CreateNodesV2,
  getPackageManagerCommand,
  readJsonFile,
  TargetConfiguration,
  targetToTargetString,
  workspaceRoot,
} from '@nx/devkit';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';
import { dirname, join } from 'path';
import {
  createVersionMatrix,
  VersionMatrixConfig,
  VersionMatrixItem,
} from '../version-matrix';

export type E2eVersionMatrixPluginOptions = {
  e2eTargetName?: string;
  e2eVersionMatrixTargetName?: string;
  peerDependencyEnvPrefix?: string;
  configurationPrefix?: string;
  configurationConfig?: TargetConfiguration<Partial<RunCommandsOptions>>;
};

const e2eVersionMatrixConfigFileName = 'e2e-version-matrix.config.json';
const e2eVersionMatrixConfigGlob = `**/${e2eVersionMatrixConfigFileName}`;

export const createNodesV2: CreateNodesV2<E2eVersionMatrixPluginOptions> = [
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

/**
 * TODO: maybe we can use the `peerDependencies` of the package.json as is and
 * find a logic to extract the _wanted_ versions.
 */
const addE2eVersionMatrix: CreateNodesFunction<
  E2eVersionMatrixPluginOptions
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
  } satisfies Required<E2eVersionMatrixPluginOptions>;

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

  let maybeE2eVersionMatrixConfig: VersionMatrixConfig;

  try {
    maybeE2eVersionMatrixConfig = readJsonFile<VersionMatrixConfig>(
      e2eVersionMatrixConfigPath,
    );
  } catch (error) {
    console.error(error);
    return {};
  }

  const e2eVersionMatrixConfig = maybeE2eVersionMatrixConfig;

  const e2eVersionMatrix = createVersionMatrix(e2eVersionMatrixConfig);

  const configurations = Object.fromEntries(
    e2eVersionMatrix.map((permutation) => [
      getConfigurationName({ permutation, configurationPrefix }),
      createConfiguration({
        permutation,
        configurationConfig,
        peerDependencyEnvPrefix,
      }),
    ]),
  );

  const e2eVersionMatrixTarget = runManyConfigurations({
    configurations: Object.keys(configurations),
    project: '{projectName}',
    target: e2eTargetName,
  });

  return {
    projects: {
      [projectRoot]: {
        targets: {
          [e2eTargetName]: {
            configurations,
          },
          [e2eVersionMatrixTargetName]: e2eVersionMatrixTarget,
        },
      },
    },
  };
};

/** @returns A configuration name based on the given permutation. */
function getConfigurationName({
  permutation: { peerDependencies },
  configurationPrefix,
}: {
  permutation: VersionMatrixItem;
  configurationPrefix: string;
}) {
  return [
    configurationPrefix,
    ...Object.entries(peerDependencies).map((name_version) =>
      name_version.join('@'),
    ),
  ].join('---');
}

/**
 * - For every peer dependency there is a env var =>
 *   {peerDependencyEnvPrefix}{peerDependency}={version}
 *
 * @returns A configuration for the given permutation.
 */
function createConfiguration({
  peerDependencyEnvPrefix,
  configurationConfig,
  permutation: { peerDependencies },
}: {
  /** Addtional config. */
  configurationConfig: TargetConfiguration<Partial<RunCommandsOptions>>;
  permutation: VersionMatrixItem;
  peerDependencyEnvPrefix: string;
}) {
  return {
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
  };
}

/**
 * Runs the given `target` of the `project` with every configuration in
 * parallel.
 */
function runManyConfigurations({
  configurations,
  target,
  project,
}: {
  project: string;
  target: string;
  configurations: string[];
}) {
  const createCommand = (configuration: string) => {
    const targetWithConfiguration = targetToTargetString({
      project,
      target,
      configuration,
    });
    return {
      command: `nx run ${targetWithConfiguration}`,
    } satisfies RunCommandsOptions['commands'][0];
  };

  const commands = configurations.map(createCommand);

  return {
    executor: 'nx:run-commands',
    options: {
      commands,
    },
  } satisfies TargetConfiguration<Partial<RunCommandsOptions>>;
}

/** @returns The project of the current e2e target. */
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
  );

  return {
    /**
     * A _safe_ folder name, which can be used as a _workspace_ for the e2e
     * test.
     */
    e2eWorkspaceName: `${Date.now()}${configuration}`
      .replace(/[^a-z0-9]/gi, '')
      .substring(0, 255),
    /** The package the e2e test targets. */
    e2ePackage: {
      name: e2eVersionMatrixConfig.name,
      version: e2eVersionMatrixConfig.version,
      peerDependencies,
    } satisfies VersionMatrixItem,
  };
}

/** Installs a package including its peer dependencies. */
export function installProject({
  workspaceRoot,
  packageManagerCommand,
  package: { name, version, peerDependencies },
}: {
  workspaceRoot: string;
  packageManagerCommand: ReturnType<typeof getPackageManagerCommand>;
  package: VersionMatrixItem;
}) {
  execSync(
    `${packageManagerCommand.addDev} ${Object.entries({
      ...peerDependencies,
      [name]: version,
    })
      .map((dep_version) => dep_version.join('@'))
      .join(' ')}`,
    {
      cwd: workspaceRoot,
    },
  );
}
