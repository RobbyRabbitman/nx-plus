import {
  type CreateNodesFunction,
  type CreateNodesV2,
  type TargetConfiguration,
  createNodesFromFiles,
} from '@nx/devkit';
import { existsSync } from 'fs';
import { basename, dirname, join } from 'path';

/**
 * The glob pattern to match `Web Dev Server` configuration files.
 *
 * https://modern-web.dev/docs/dev-server/cli-and-configuration/#configuration-file
 */
const WEB_DEV_SERVER_CONFIG_FILE_NAME_GLOB =
  '**/@(web-dev-server|wds).config.@(js|cjs|mjs)';

const WEB_DEV_SERVER_COMMAND = 'web-dev-server';

/**
 * TODO: '@web/dev-server' does not export the `DevServerCliArgs` type - add it
 * when its exported from their public api.
 *
 * https://github.com/modernweb-dev/web/blob/17cfc0d70f46b321912e4506b2cccae1b16b1534/packages/dev-server/src/config/readCliArgs.ts#L6-L20
 */
type WebDevServerTargetConfiguration = TargetConfiguration;

interface WebDevServerPluginOptions {
  /**
   * The name of the `Web Dev Server` serve target e.g. `'serve'` or
   * `'web-dev-server'`.
   */
  serveTargetName?: string;

  /**
   * The configuration of the `Web Dev Server` _serve_ target target identified
   * by {@link WebDevServerPluginOptions.serveTargetName serveTargetName}.
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

export const createNodesV2 = [
  WEB_DEV_SERVER_CONFIG_FILE_NAME_GLOB,
  (webDevServerConfigPaths, options, context) => {
    return createNodesFromFiles(
      createWebDevServerTarget,
      webDevServerConfigPaths,
      options ?? {},
      context,
    );
  },
] satisfies CreateNodesV2<WebDevServerPluginOptions>;

export const DEFAULT_WEB_DEV_SERVER_TARGET_NAME = 'serve';

const createWebDevServerTarget: CreateNodesFunction<
  WebDevServerPluginOptions | undefined
> = (webDevServerConfigPath, userOptions, context) => {
  const options = normalizeWebDevServerOptions(userOptions);

  const { serveTargetName, serveTargetConfig } = options;

  const webDevServerInformation = extractWebDevServerInformation(
    webDevServerConfigPath,
    context.workspaceRoot,
  );

  if (!webDevServerInformation.isProject) {
    return {};
  }

  /**
   * TODO: '@web/dev-server' does not export the `DevServerCliArgs` type - add
   * it when its exported from their public api.
   *
   * https://github.com/modernweb-dev/web/blob/17cfc0d70f46b321912e4506b2cccae1b16b1534/packages/dev-server/src/config/readCliArgs.ts#L6-L20
   */
  const webDevServerDefaultCliArgs = {
    config: webDevServerInformation.configFileName,
    watch: true,
  };

  const webDevServerTargetConfiguration = {
    command: WEB_DEV_SERVER_COMMAND,
    ...serveTargetConfig,
    options: {
      cwd: webDevServerInformation.configDir,
      ...webDevServerDefaultCliArgs,
      ...serveTargetConfig.options,
    },
  } satisfies WebDevServerTargetConfiguration;

  return {
    projects: {
      [webDevServerInformation.configDir]: {
        targets: {
          [serveTargetName]: webDevServerTargetConfiguration,
        },
      },
    },
  };
};

function normalizeWebDevServerOptions(userOptions?: WebDevServerPluginOptions) {
  const normalizedOptions = {
    serveTargetName: DEFAULT_WEB_DEV_SERVER_TARGET_NAME,
    serveTargetConfig: {},
    ...userOptions,
  } satisfies WebDevServerPluginOptions;

  /** Make sure `serveTargetName` is not an empty string */
  if (normalizedOptions.serveTargetName === '') {
    normalizedOptions.serveTargetName = DEFAULT_WEB_DEV_SERVER_TARGET_NAME;
  }

  return normalizedOptions;
}

function extractWebDevServerInformation(
  webDevServerConfigPath: string,
  workspaceRoot: string,
) {
  const configDir = dirname(webDevServerConfigPath);

  return {
    configFileName: basename(webDevServerConfigPath),
    configDir,
    isProject: isProject(configDir, workspaceRoot),
  };
}

/**
 * Returns true if the directory contains a `project.json` or `package.json`
 * file.
 */
function isProject(directory: string, workspaceRoot: string) {
  return (
    existsSync(join(workspaceRoot, directory, 'project.json')) ||
    existsSync(join(workspaceRoot, directory, 'package.json'))
  );
}
