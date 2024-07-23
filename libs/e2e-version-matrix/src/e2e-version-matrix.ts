import {
  CreateNodesContextV2,
  createNodesFromFiles,
  CreateNodesFunction,
  CreateNodesV2,
  getPackageManagerCommand,
  readJsonFile,
  TargetConfiguration,
  workspaceRoot,
} from '@nx/devkit';
import { generateNxWorkspaceName } from '@robby-rabbitman/nx-plus-libs-e2e-util';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';
import { dirname, join } from 'path';
import {
  createVersionMatrix,
  VersionMatrixConfig,
  VersionMatrixItem,
} from './version-matrix';

export type E2eVersionMatrixPluginSchema =
  Partial<E2eVersionMatrixPluginOptions>;

export type E2eVersionMatrixPluginOptions = {
  targetPrefix: string;
  targetConfiguration: TargetConfiguration;
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
  schema,
  context,
) => {
  try {
    const options = {
      targetPrefix: 'version-matrix',
      targetConfiguration: {},
      ...schema,
    } satisfies E2eVersionMatrixPluginOptions;

    const { projectRoot } = addE2eVersionMatrix__assertIsProject({
      e2eVersionMatrixConfigPath,
      options,
      context,
    });

    const { e2eVersionMatrixConfig } =
      addE2eVersionMatrix__getE2eVersionMatrixConfig({
        e2eVersionMatrixConfigPath,
        options,
        context,
      });

    const e2eVersionMatrix = createVersionMatrix(e2eVersionMatrixConfig);

    const { e2eVersionTargets } = addE2eVersionMatrix__createTargets({
      e2eVersionMatrixConfigPath,
      options,
      context,
      e2eVersionMatrix,
      peerDependencyEnvPrefix: E2E_VERSION_MATRIX_PEER_DEPENDENCY_ENV_PREFIX,
    });

    return {
      projects: {
        [projectRoot]: {
          targets: e2eVersionTargets,
        },
      },
    };
  } catch (error) {
    return {};
  }
};

function addE2eVersionMatrix__assertIsProject({
  e2eVersionMatrixConfigPath,
  context,
}: {
  e2eVersionMatrixConfigPath: string;
  options: E2eVersionMatrixPluginOptions;
  context: CreateNodesContextV2;
}) {
  const maybeProjectRoot = dirname(e2eVersionMatrixConfigPath);

  const isProject =
    existsSync(join(context.workspaceRoot, maybeProjectRoot, 'project.json')) ||
    existsSync(join(context.workspaceRoot, maybeProjectRoot, 'package.json'));

  if (!isProject) {
    throw new Error(`Not a project: ${maybeProjectRoot}`);
  }

  return { projectRoot: maybeProjectRoot };
}

function addE2eVersionMatrix__getE2eVersionMatrixConfig({
  e2eVersionMatrixConfigPath,
}: {
  e2eVersionMatrixConfigPath: string;
  options: E2eVersionMatrixPluginOptions;
  context: CreateNodesContextV2;
}) {
  const e2eVersionMatrixConfig = readJsonFile<VersionMatrixConfig>(
    e2eVersionMatrixConfigPath,
  );

  return { e2eVersionMatrixConfig };
}

function addE2eVersionMatrix__createTargets({
  e2eVersionMatrix,
  peerDependencyEnvPrefix,
  options,
  e2eVersionMatrixConfigPath,
  context,
}: {
  e2eVersionMatrixConfigPath: string;
  options: E2eVersionMatrixPluginOptions;
  context: CreateNodesContextV2;
  e2eVersionMatrix: VersionMatrixItem[];
  peerDependencyEnvPrefix: string;
}) {
  const e2eVersionTargets = Object.fromEntries(
    e2eVersionMatrix.map((permutation) => [
      addE2eVersionMatrix__createTargetName({
        e2eVersionMatrixConfigPath,
        options,
        context,
        permutation,
        targetPrefix: options.targetPrefix,
      }),
      addE2eVersionMatrix__createTargetConfiguration({
        e2eVersionMatrixConfigPath,
        options,
        context,
        permutation,
        targetConfiguration: options.targetConfiguration,
        peerDependencyEnvPrefix,
      }),
    ]),
  );

  return { e2eVersionTargets };
}

function addE2eVersionMatrix__createTargetName({
  permutation,
  targetPrefix,
}: {
  e2eVersionMatrixConfigPath: string;
  options: E2eVersionMatrixPluginOptions;
  context: CreateNodesContextV2;
  permutation: VersionMatrixItem;
  targetPrefix: string;
}) {
  return [
    targetPrefix,
    ...Object.entries(permutation.peerDependencies).map((name_version) =>
      name_version.join('@'),
    ),
  ].join('---');
}

function addE2eVersionMatrix__createTargetConfiguration({
  peerDependencyEnvPrefix,
  targetConfiguration,
  permutation,
}: {
  e2eVersionMatrixConfigPath: string;
  options: E2eVersionMatrixPluginOptions;
  context: CreateNodesContextV2;
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
          Object.entries(permutation.peerDependencies).map(
            ([name, version]) => [`${peerDependencyEnvPrefix}${name}`, version],
          ),
        ),
        [E2E_VERSION_MATRIX_PEER_DEPENDENCY_ENV_PREFIX]:
          peerDependencyEnvPrefix,
        ...targetConfiguration.options['env'],
      },
    },
  };
}

function assertIsE2eVersionMatrix() {
  if (!isE2eVersionMatrix()) {
    throw new Error('Running an e2e version matrix test?');
  }
}

export const isE2eVersionMatrix = () => {
  return E2E_VERSION_MATRIX_PEER_DEPENDENCY_ENV_PREFIX in process.env;
};

export function getPeerDependencyEnvPrefix() {
  assertIsE2eVersionMatrix();

  const peerDependencyEnvPrefix =
    process.env[E2E_VERSION_MATRIX_PEER_DEPENDENCY_ENV_PREFIX];

  return peerDependencyEnvPrefix;
}

/** @returns The project of the current e2e target. */
export function getE2eVersionMatrixProject() {
  assertIsE2eVersionMatrix();

  const peerDependencyEnvPrefix = getPeerDependencyEnvPrefix();

  const peerDependencyEnvVars = Object.keys(process.env).filter((envVar) =>
    envVar.startsWith(peerDependencyEnvPrefix),
  );

  const projectName = process.env['NX_TASK_TARGET_PROJECT'];
  const targetName = process.env['NX_TASK_TARGET_TARGET'];
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
    e2eWorkspaceName: generateNxWorkspaceName({
      name: targetName,
    }),
    /** The package the e2e test targets. */
    e2ePackage: {
      name: e2eVersionMatrixConfig.name,
      version: e2eVersionMatrixConfig.version,
      peerDependencies,
    } satisfies VersionMatrixItem,
  };
}

/** Installs a package including its peer dependencies. */
export function installE2eVersionMatrixProject({
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
