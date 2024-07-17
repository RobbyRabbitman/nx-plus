import {
  CreateNodes,
  CreateNodesContextV2,
  CreateNodesFunction,
  CreateNodesV2,
  TargetConfiguration,
  createNodesFromFiles,
} from '@nx/devkit';
import { DevServerConfig } from '@web/dev-server';
import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';

// TODO: copy pasta from '@web/dev-server/src/config/readCliArgs', remove this type if its exported from their public api
// import { DevServerCliArgs } from '@web/dev-server';
export interface DevServerCliArgs
  extends Partial<
    Pick<
      DevServerConfig,
      | 'rootDir'
      | 'open'
      | 'appIndex'
      | 'preserveSymlinks'
      | 'nodeResolve'
      | 'watch'
      | 'esbuildTarget'
    >
  > {
  config?: string;
}

export type WebDevServerTargetConfiguration = TargetConfiguration<
  Partial<RunCommandsOptions> & DevServerCliArgs
>;

export type WebDevServerTargetPluginSchema = {
  /**
   * The name of the `web-dev-server` serve target e.g. `'serve'` or
   * `'web-dev-server'`.
   */
  serveTargetName?: string;

  /** The configuration of the `web-dev-server` _serve_ target. */
  serveTargetConfig?: WebDevServerTargetConfiguration;
};

export type WebDevServerTargetPluginOptions =
  Required<WebDevServerTargetPluginSchema>;

export const WEB_DEV_SERVER_CONFIG_FILE_NAME_GLOB =
  '**/@(web-dev-server|wds).config.@(js|cjs|mjs)';

export const WEB_DEV_SERVER_COMMAND = 'web-dev-server';

// TODO: remove me in nx20
export const createNodes: CreateNodes<WebDevServerTargetPluginSchema> = [
  WEB_DEV_SERVER_CONFIG_FILE_NAME_GLOB,
  (webDevServerConfigPath, options, context) =>
    createWebDevServerTarget(webDevServerConfigPath, options, context),
];

// TODO: rename me in nx21
export const createNodesV2: CreateNodesV2<WebDevServerTargetPluginSchema> = [
  WEB_DEV_SERVER_CONFIG_FILE_NAME_GLOB,
  (webDevServerConfigPaths, options, context) => {
    return createNodesFromFiles(
      createWebDevServerTarget,
      webDevServerConfigPaths,
      options,
      context,
    );
  },
];

/**
 * Helper function for `createNodes`.
 *
 * 1. Checks whether `webDevServerConfigPath` is considered a non root project, if
 *    not returns without modifying the project graph.
 * 2. Adds a _serve_ target, which calls the `web-dev-server` cli in the project
 *    root when executed. Merges `schema.serveTargetConfig` into this target.
 *
 * @param webDevServerConfigPath Relative to `context.workspaceRoot` e.g
 *   `'path/to/web-dev-server.config.js'`
 * @param schema Of `createNodes`
 * @param context Of `createNodes`
 * @returns
 */
const createWebDevServerTarget: CreateNodesFunction<
  WebDevServerTargetPluginSchema
> = (webDevServerConfigPath, schema, context) => {
  const defaultServeTargetName = 'serve';

  const options = {
    serveTargetName: defaultServeTargetName,
    serveTargetConfig: {},
    ...schema,
  } satisfies WebDevServerTargetPluginOptions;

  // make sure `serveTargetName` is not an empty string
  if (options.serveTargetName === '') {
    options.serveTargetName = defaultServeTargetName;
  }

  const { serveTargetName, serveTargetConfig } = options;

  const webDevServerConfigFileName = basename(webDevServerConfigPath);
  const maybeWebDevServerProjectRoot = dirname(webDevServerConfigPath);

  // 1.
  if (!isNonRootProject(maybeWebDevServerProjectRoot, context)) {
    return {};
  }

  const webDevServerProjectRoot = maybeWebDevServerProjectRoot;

  // 2.
  const webDevServerConfiguration = {
    config: webDevServerConfigFileName,
    watch: true,
  } satisfies DevServerCliArgs;

  const webDevServerTargetConfiguration = {
    command: WEB_DEV_SERVER_COMMAND,
    ...serveTargetConfig,
    options: {
      ...webDevServerConfiguration,
      cwd: '{projectRoot}',
      ...serveTargetConfig.options,
    },
  } satisfies WebDevServerTargetConfiguration;

  return {
    projects: {
      [webDevServerProjectRoot]: {
        targets: {
          [serveTargetName]: webDevServerTargetConfiguration,
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
