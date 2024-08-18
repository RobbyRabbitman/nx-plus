import {
  CreateNodesContextV2,
  CreateNodesFunction,
  CreateNodesV2,
  TargetConfiguration,
  createNodesFromFiles,
} from '@nx/devkit';
import { existsSync } from 'fs';
import { basename, dirname, join } from 'path';

export type TscTargetConfiguration = TargetConfiguration;

export type TscPluginSchema = {
  tscTargetName?: string;
  tsConfigSuffix?: string;
  tscTargetConfig?: TscTargetConfiguration;
};

export type TscPluginOptions = Required<TscPluginSchema>;

export const TS_CONFIG_GLOB = '**/tsconfig*.json';

export const NX_TSC_EXECUTOR_NAME = '@nx/js:tsc';

// TODO: rename me in nx21
export const createNodesV2: CreateNodesV2<TscPluginSchema> = [
  TS_CONFIG_GLOB,
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
  const defaultTsConfigSuffix = '.lib';

  const options = {
    tscTargetName: defaultTscTargetName,
    tsConfigSuffix: defaultTsConfigSuffix,
    tscTargetConfig: {},
    ...schema,
  } satisfies TscPluginOptions;

  // make sure `tscTargetName` is not an empty string
  if (options.tscTargetName === '') {
    options.tscTargetName = defaultTscTargetName;
  }

  const { tscTargetName, tsConfigSuffix, tscTargetConfig } = options;

  const maybeTargetTsConfigName = basename(tsConfigPath);

  const targetTsConfigName = `tsconfig${tsConfigSuffix}.json`;

  // 1. Filter target tsconfig
  //
  // In project 'app-1' 'tsconfig.app.json' may be the _build_ target while in project 'lib-1' 'tsconfig.lib.json' may be the _build_ target.
  //
  // apps
  //  app-1
  //    tsconfig.json
  //    tsconfig.app.json
  //    tsconfig.spec.json
  // libs
  //  lib-1
  //    tsconfig.json
  //    tsconfig.lib.json
  //    tsconfig.spec.json
  //
  // This plugin is then registered multiple times in the nx.json:
  //
  // 1. with `tscTargetName=build` + `tsConfigSuffix=.app` + `include=**/tsconfig.app.json`
  // 2. with `tscTargetName=build` + `tsConfigSuffix=.lib` + `include=**/tsconfig.lib.json`
  // (3. with `tscTargetName=build-spec` + `tsConfigSuffix=.spec`)
  //
  // Therefore this plugins glob matches _all_ tsconfigs, which then need to get filtered:
  if (maybeTargetTsConfigName !== targetTsConfigName) {
    return {};
  }

  const maybeTsProjectRoot = dirname(tsConfigPath);

  // 2. check if its a project
  if (!isNonRootProject(maybeTsProjectRoot, context)) {
    return {};
  }
  const tsProjectRoot = maybeTsProjectRoot;

  // 3. define the default `@nx/js:tsc` options
  const tscCliConfiguration = {
    outputPath: 'dist/{projectRoot}',
    main: '{projectRoot}/src/index.ts',
    tsConfig: tsConfigPath,
  };

  const tscTargetConfiguration = {
    executor: NX_TSC_EXECUTOR_NAME,
    cache: true,
    dependsOn: ['^build'],
    inputs: ['default', '^default'],
    outputs: ['{options.outputPath}'],
    ...tscTargetConfig,
    options: {
      ...tscCliConfiguration,
      ...tscTargetConfig.options,
    },
  } satisfies TscTargetConfiguration;

  return {
    projects: {
      [tsProjectRoot]: {
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
