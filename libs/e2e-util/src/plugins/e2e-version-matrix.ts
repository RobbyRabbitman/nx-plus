import {
  createNodesFromFiles,
  CreateNodesFunction,
  CreateNodesV2,
  getPackageManagerCommand,
  readJsonFile,
  TargetConfiguration,
  workspaceRoot,
} from '@nx/devkit';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';
import { dirname, join } from 'path';
import {
  createVersionMatrix,
  VersionMatrixConfig,
  VersionMatrixItem,
} from '../version-matrix';

export type E2eVersionMatrixPluginSchema =
  Partial<E2eVersionMatrixPluginOptions>;

export type E2eVersionMatrixPluginOptions = {
  targetPrefix: string;
  targetConfiguration: TargetConfiguration;
  peerDependencyEnvPrefix: string;
};

const e2eVersionMatrixConfigFileName = 'e2e-version-matrix.config.json';
const e2eVersionMatrixConfigGlob = `**/${e2eVersionMatrixConfigFileName}`;
const E2E_VERSION_MATRIX_PEER_DEPENDENCY_ENV_PREFIX =
  'E2E_VERSION_MATRIX_PEER_DEPENDENCY_ENV_PREFIX';

export const createNodesV2: CreateNodesV2<E2eVersionMatrixPluginSchema> = [
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
const addE2eVersionMatrix: CreateNodesFunction<E2eVersionMatrixPluginSchema> = (
  e2eVersionMatrixConfigPath,
  options,
  context,
) => {
  const { peerDependencyEnvPrefix, targetPrefix, targetConfiguration } = {
    peerDependencyEnvPrefix: 'E2E_PEER_DEPENDENCY_',
    targetPrefix: 'version-matrix',
    targetConfiguration: {},
    ...options,
  } satisfies E2eVersionMatrixPluginOptions;

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

  const e2eVersionTargets = createTargets({
    e2eVersionMatrix,
    targetPrefix,
    targetConfiguration,
    peerDependencyEnvPrefix,
  });

  return {
    projects: {
      [projectRoot]: {
        targets: e2eVersionTargets,
      },
    },
  };
};

function createTargets({
  e2eVersionMatrix,
  targetPrefix,
  targetConfiguration,
  peerDependencyEnvPrefix,
}: {
  e2eVersionMatrix: VersionMatrixItem[];
  targetPrefix: string;
  targetConfiguration: TargetConfiguration;
  peerDependencyEnvPrefix: string;
}) {
  return Object.fromEntries(
    e2eVersionMatrix.map((permutation) => [
      createTargetName({ permutation, targetPrefix }),
      createTargetConfiguration({
        permutation,
        targetConfiguration,
        peerDependencyEnvPrefix,
      }),
    ]),
  );
}

/** @returns A target name based on the given permutation. */
function createTargetName({
  permutation: { peerDependencies },
  targetPrefix,
}: {
  permutation: VersionMatrixItem;
  targetPrefix: string;
}) {
  return [
    targetPrefix,
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
function createTargetConfiguration({
  peerDependencyEnvPrefix,
  targetConfiguration,
  permutation: { peerDependencies },
}: {
  targetConfiguration: TargetConfiguration;
  permutation: VersionMatrixItem;
  peerDependencyEnvPrefix: string;
}) {
  return {
    ...targetConfiguration,
    options: {
      ...targetConfiguration.options,
      env: {
        ...Object.fromEntries(
          Object.entries(peerDependencies).map(([name, version]) => [
            `${peerDependencyEnvPrefix}${name}`,
            version,
          ]),
        ),
        [E2E_VERSION_MATRIX_PEER_DEPENDENCY_ENV_PREFIX]:
          peerDependencyEnvPrefix,
        ...targetConfiguration.options['env'],
      },
    },
  };
}

export function getPeerDependencyEnvPrefix() {
  const peerDependencyEnvPrefix =
    process.env[E2E_VERSION_MATRIX_PEER_DEPENDENCY_ENV_PREFIX];

  if (!peerDependencyEnvPrefix) {
    throw new Error(
      `E2E_VERSION_MATRIX_PEER_DEPENDENCY_ENV_PREFIX not set! Running an e2e version matrix test?`,
    );
  }

  return peerDependencyEnvPrefix;
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
