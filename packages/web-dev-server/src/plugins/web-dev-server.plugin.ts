import {
  type CreateNodesFunction,
  type CreateNodesV2,
  type TargetConfiguration,
  createNodesFromFiles,
} from '@nx/devkit';
import { existsSync } from 'fs';
import { basename, dirname, join } from 'path';

export const WEB_DEV_SERVER_CONFIG_FILE_NAME_GLOB =
  '**/@(web-dev-server|wds).config.@(js|cjs|mjs)';

export const WEB_DEV_SERVER_COMMAND = 'web-dev-server';

/**
 * TODO: '@web/dev-server' does not export the `DevServerCliArgs` type - add it
 * when its exported from their public api.
 *
 * https://github.com/modernweb-dev/web/blob/17cfc0d70f46b321912e4506b2cccae1b16b1534/packages/dev-server/src/config/readCliArgs.ts#L6-L20
 */
export type WebDevServerTargetConfiguration = TargetConfiguration;

export interface WebDevServerPluginSchema {
  /**
   * The name of the `web-dev-server` serve target e.g. `'serve'` or
   * `'web-dev-server'`.
   */
  serveTargetName?: string;

  /**
   * The configuration of the `web-dev-server` _serve_ target target identified
   * by {@link WebDevServerPluginSchema.serveTargetName serveTargetName}.
   *
   * @example
   *   {
   *     "watch": true
   *   }
   *
   * @see https://modern-web.dev/docs/dev-server/cli-and-configuration/
   */
  serveTargetConfig?: WebDevServerTargetConfiguration;
}

export type WebDevServerPluginOptions = Required<WebDevServerPluginSchema>;

export const createNodesV2 = [
  WEB_DEV_SERVER_CONFIG_FILE_NAME_GLOB,
  (webDevServerConfigPaths, options, context) => {
    return createNodesFromFiles(
      createWebDevServerTarget,
      webDevServerConfigPaths,
      options,
      context,
    );
  },
] satisfies CreateNodesV2<WebDevServerPluginSchema>;

export const DEFAULT_WEB_DEV_SERVER_TARGET_NAME = 'serve';

const createWebDevServerTarget: CreateNodesFunction<
  WebDevServerPluginSchema | undefined
> = (webDevServerConfigPath, schema, context) => {
  const defaultWebDevServerTargetName = DEFAULT_WEB_DEV_SERVER_TARGET_NAME;

  const options = {
    serveTargetName: defaultWebDevServerTargetName,
    serveTargetConfig: {},
    ...schema,
  } satisfies WebDevServerPluginOptions;

  /** Make sure `serveTargetName` is not an empty string */
  if (options.serveTargetName === '') {
    options.serveTargetName = defaultWebDevServerTargetName;
  }

  const { serveTargetName, serveTargetConfig } = options;

  const webDevServerConfigFileName = basename(webDevServerConfigPath);
  const maybeWebDevServerProjectRoot = dirname(webDevServerConfigPath);

  if (!isProject(maybeWebDevServerProjectRoot, context.workspaceRoot)) {
    return {};
  }

  const webDevServerProjectRoot = maybeWebDevServerProjectRoot;

  /**
   * TODO: '@web/dev-server' does not export the `DevServerCliArgs` type - add
   * it when its exported from their public api.
   *
   * https://github.com/modernweb-dev/web/blob/17cfc0d70f46b321912e4506b2cccae1b16b1534/packages/dev-server/src/config/readCliArgs.ts#L6-L20
   */
  const webDevServerConfiguration = {
    config: webDevServerConfigFileName,
    watch: true,
  };

  const webDevServerTargetConfiguration = {
    command: WEB_DEV_SERVER_COMMAND,
    ...serveTargetConfig,
    options: {
      cwd: '{projectRoot}',
      ...webDevServerConfiguration,
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

const isProject = (directory: string, workspaceRoot: string) => {
  return (
    existsSync(join(workspaceRoot, directory, 'project.json')) ||
    existsSync(join(workspaceRoot, directory, 'package.json'))
  );
};
