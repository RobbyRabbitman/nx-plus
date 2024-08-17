import {
  createNodesFromFiles,
  CreateNodesFunction,
  CreateNodesV2,
  getPackageManagerCommand,
  logger,
  readCachedProjectGraph,
  TargetConfiguration,
  workspaceRoot,
} from '@nx/devkit';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import {
  createVersionMatrix,
  VersionMatrixConfig,
  VersionMatrixPermutation,
} from './version-matrix';

export type E2eVersionMatrixPluginSchema =
  Partial<E2eVersionMatrixPluginOptions>;

export type E2eVersionMatrixPluginOptions = {
  targetName: string;
  targetConfiguration: TargetConfiguration;
  permutationTargetPrefix: string;
  permutationTargetConfiguration: TargetConfiguration;
};

const e2eVersionMatrixConfigFileName = 'e2e-version-matrix.config.json';
const e2eVersionMatrixConfigGlob = `**/${e2eVersionMatrixConfigFileName}`;

/**
 * The prefix of the environment variables used by the e2e version matrix
 * plugin.
 */
export const E2E_VERSION_MATRIX_PLUGIN_ENV_PREFIX = 'E2E_VERSION_MATRIX_PLUGIN';
export const E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_ENV_PREFIX = `${E2E_VERSION_MATRIX_PLUGIN_ENV_PREFIX}_PEER_DEPENDENCY`;

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

const addE2eVersionMatrix: CreateNodesFunction<E2eVersionMatrixPluginSchema> = (
  e2eVersionMatrixConfigPath,
  schema,
  context,
) => {
  try {
    const {
      permutationTargetConfiguration,
      permutationTargetPrefix,
      targetConfiguration,
      targetName,
    } = schemaToOptions({ schema });

    const projectRoot = assertIsProject({
      e2eVersionMatrixConfigPath,
      workspaceRoot: context.workspaceRoot,
    });

    const e2eVersionMatrixConfig = getE2eVersionMatrixConfig({
      e2eVersionMatrixConfigPath: join(
        context.workspaceRoot,
        e2eVersionMatrixConfigPath,
      ),
    });

    const e2eVersionMatrix = createVersionMatrix(e2eVersionMatrixConfig);

    const permutationTargets = Object.fromEntries(
      e2eVersionMatrix.map((permutation) => [
        createE2eVersionMatrixPermutationTargetName({
          permutation,
          permutationTargetPrefix,
        }),
        createE2eVersionMatrixPermutationTargetConfiguration({
          permutation,
          targetConfiguration: permutationTargetConfiguration,
          peerDependencyEnvPrefix:
            E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_ENV_PREFIX,
        }),
      ]),
    );

    return {
      projects: {
        [projectRoot]: {
          targets: {
            // add the permutation targets
            ...permutationTargets,
            // add the version matrix target
            [targetName]: createE2eVersionMatrixTargetConfiguration({
              targetConfiguration,
              versionMatrixConfig: e2eVersionMatrixConfig,
              permutationTargetNames: Object.keys(permutationTargets),
            }),
          },
        },
      },
    };
  } catch (error) {
    logger.error(error);
    return {};
  }
};

function schemaToOptions({ schema }: { schema: E2eVersionMatrixPluginSchema }) {
  const options = {
    targetName: 'e2e-version-matrix',
    targetConfiguration: {},
    permutationTargetPrefix: 'e2e-version-matrix-permutation',
    permutationTargetConfiguration: {},
    ...schema,
  } satisfies E2eVersionMatrixPluginOptions;

  return options;
}

function assertIsProject({
  e2eVersionMatrixConfigPath,
  workspaceRoot,
}: {
  e2eVersionMatrixConfigPath: string;
  workspaceRoot: string;
}) {
  const maybeProjectRoot = dirname(e2eVersionMatrixConfigPath);

  const isProject =
    existsSync(join(workspaceRoot, maybeProjectRoot, 'project.json')) ||
    existsSync(join(workspaceRoot, maybeProjectRoot, 'package.json'));

  if (!isProject) {
    throw new Error(`Not a project: ${maybeProjectRoot}`);
  }

  return maybeProjectRoot;
}

function getE2eVersionMatrixConfig({
  e2eVersionMatrixConfigPath,
}: {
  e2eVersionMatrixConfigPath: string;
}) {
  const e2eVersionMatrixConfig = JSON.parse(
    readFileSync(e2eVersionMatrixConfigPath, 'utf-8'),
  ) as VersionMatrixConfig;

  return e2eVersionMatrixConfig;
}

function createE2eVersionMatrixPermutationTargetName({
  permutation,
  permutationTargetPrefix,
}: {
  permutation: VersionMatrixPermutation;
  permutationTargetPrefix: string;
}) {
  const permutationTargetName = [
    permutationTargetPrefix,
    ...Object.entries(permutation.peerDependencies).map(
      ([name, version]) => `${name}@${version}`,
    ),
  ].join('---');

  return permutationTargetName;
}

function createE2eVersionMatrixPermutationTargetConfiguration({
  targetConfiguration,
  permutation,
  peerDependencyEnvPrefix,
}: {
  targetConfiguration: TargetConfiguration;
  permutation: VersionMatrixPermutation;
  peerDependencyEnvPrefix: string;
}) {
  const peerDependencyEnvVars = Object.fromEntries(
    Object.entries(permutation.peerDependencies).map(([name, version]) => [
      `${peerDependencyEnvPrefix}_${name}`,
      version,
    ]),
  );

  return {
    ...targetConfiguration,
    // the minimum inputs are the peer dependencies and the peer dependency environment variables
    inputs: [
      { externalDependencies: Object.keys(permutation.peerDependencies) },
      ...Object.keys(peerDependencyEnvVars).map((env) => ({ env })),
      ...(targetConfiguration?.inputs ?? []),
    ],
    options: {
      ...targetConfiguration?.options,
      env: {
        // For each peer dependency, set a environment variable with the name and version: e.g. `{{prefix}}_nx=^19`. A e2e test can use those to install the peer dependencies.
        ...peerDependencyEnvVars,
        ...targetConfiguration?.options?.env,
      },
    },
  } satisfies TargetConfiguration;
}

function createE2eVersionMatrixTargetConfiguration({
  targetConfiguration,
  versionMatrixConfig,
  permutationTargetNames,
}: {
  targetConfiguration: TargetConfiguration;
  versionMatrixConfig: VersionMatrixConfig;
  permutationTargetNames: string[];
}) {
  return {
    ...targetConfiguration,
    inputs: [
      // the minimum inputs are the peer dependencies
      {
        externalDependencies: Object.keys(versionMatrixConfig.peerDependencies),
      },
      ...(targetConfiguration?.inputs ?? []),
    ],
    dependsOn: [
      ...permutationTargetNames,
      ...(targetConfiguration?.dependsOn ?? []),
    ],
  } satisfies TargetConfiguration;
}

/** @returns The project of the current e2e target. */
export function getE2eVersionMatrixProject() {
  const peerDependencyEnvPrefix = `${E2E_VERSION_MATRIX_PLUGIN_PEER_DEPENDENCY_ENV_PREFIX}_`;

  const peerDependencyEnvVars = Object.keys(process.env).filter((envVar) =>
    envVar.startsWith(peerDependencyEnvPrefix),
  );

  const projectName = process.env['NX_TASK_TARGET_PROJECT'];
  const targetName = process.env['NX_TASK_TARGET_TARGET'];
  const project = readCachedProjectGraph().nodes[projectName].data;

  const e2eVersionMatrixConfig = getE2eVersionMatrixConfig({
    e2eVersionMatrixConfigPath: join(
      workspaceRoot,
      project.root,
      e2eVersionMatrixConfigFileName,
    ),
  });

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
    e2eWorkspaceName: generateWorkspaceName({
      name: targetName,
    }),
    /** The package of the e2e test target. */
    e2ePackage: {
      name: e2eVersionMatrixConfig.name,
      version: e2eVersionMatrixConfig.version,
      peerDependencies,
    } satisfies VersionMatrixPermutation,
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
  package: VersionMatrixPermutation;
}) {
  execSync(
    `${packageManagerCommand.addDev} ${Object.entries({
      ...peerDependencies,
      [name]: version,
    })
      .map(([dependency, version]) => `${dependency}@${version}`)
      .join(' ')}`,
    {
      cwd: workspaceRoot,
      stdio: 'inherit',
    },
  );
}

function generateWorkspaceName({ name }: { name?: string }) {
  return `${randomUUID()}-${name ?? ''}`
    .replace(/[^a-z0-9-]/gi, '')
    .substring(0, 255);
}
