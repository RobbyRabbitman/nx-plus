import {
  CreateNodesContextV2,
  CreateNodesFunction,
  CreateNodesV2,
  TargetConfiguration,
  createNodesFromFiles,
} from '@nx/devkit';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type TscTargetConfiguration = TargetConfiguration;

export type TscPluginSchema = {
  tscTargetName?: string;
  tsConfigSuffix?: string;
  tscTargetConfig?: TscTargetConfiguration;
};

export type TscTargetPluginOptions = Required<TscPluginSchema>;

export const TS_CONFIG_FILE_NAME_GLOB = '**/tsconfig.*.json';

export const NX_TSC_EXECUTOR_NAME = '@nx/js:tsc';

// TODO: rename me in nx21
export const createNodesV2: CreateNodesV2<TscPluginSchema> = [
  TS_CONFIG_FILE_NAME_GLOB,
  (tsConfigPaths, schema, context) => {
    return createNodesFromFiles(
      createTscTarget,
      tsConfigPaths,
      schema,
      context,
    );
  },
];

const createTscTarget: CreateNodesFunction<TscPluginSchema | undefined> = (
  tsConfigPath,
  schema,
  context,
) => {
  const defaultTscTargetName = 'build';
  const defaultTsConfigSuffix = 'lib';

  const options = {
    tscTargetName: defaultTscTargetName,
    tsConfigSuffix: defaultTsConfigSuffix,
    tscTargetConfig: {},
    ...schema,
  } satisfies TscTargetPluginOptions;

  // make sure `tscTargetName` is not an empty string
  if (options.tscTargetName === '') {
    options.tscTargetName = defaultTscTargetName;
  }

  // make sure `tsConfigSuffix` is not an empty string
  if (options.tsConfigSuffix === '') {
    options.tsConfigSuffix = defaultTsConfigSuffix;
  }

  const { tscTargetName, tsConfigSuffix, tscTargetConfig } = options;

  const maybeTscProjectRoot = dirname(tsConfigPath);

  // 1.
  if (!isNonRootProject(maybeTscProjectRoot, context)) {
    return {};
  }
  const tscProjectRoot = maybeTscProjectRoot;

  // 2.
  const maybeResolvedTsConfig = join(
    tscProjectRoot,
    `tsconfig.${tsConfigSuffix}.json`,
  );

  const isTsConfig = existsSync(maybeResolvedTsConfig);

  if (!isTsConfig) {
    return {};
  }

  const resolvedTsConfigPath = maybeResolvedTsConfig;

  // 3.
  const tscConfiguration = {
    outputPath: 'dist/{projectRoot}',
    main: '{projectRoot}/src/index.ts',
    tsConfig: resolvedTsConfigPath,
  };

  const tscTargetConfiguration = {
    executor: NX_TSC_EXECUTOR_NAME,
    cache: true,
    dependsOn: ['^build'],
    inputs: ['default', '^default'],
    outputs: ['{options.outputPath}'],
    ...tscTargetConfig,
    options: {
      ...tscConfiguration,
      ...tscTargetConfig.options,
    },
  } satisfies TscTargetConfiguration;

  return {
    projects: {
      [tscProjectRoot]: {
        targets: {
          [tscTargetName]: tscTargetConfiguration,
        },
      },
    },
  };
};

/**
 * Helper function for `createNodes`.
 *
 * https://nx.dev/extending-nx/recipes/project-graph-plugins#identifying-projects
 *
 * @param directory Relative to `context.workspaceRoot` e.g `'path/to/project'`
 * @returns Whether `directory` is considered a non root project => `directory`
 *   is not `context.workspaceRoot` and has a `project.json` or `package.json`
 */
const isNonRootProject = (directory: string, context: CreateNodesContextV2) => {
  if (directory === '.') return false;

  return (
    existsSync(join(context.workspaceRoot, directory, 'project.json')) ||
    existsSync(join(context.workspaceRoot, directory, 'package.json'))
  );
};
