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

// copy pasta from '@web/dev-server/src/config/readCliArgs'
// maybe its exported in the future
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

export type WebDevServerTargetPluginOptions = {
  /** The name of the web-dev-server target. */
  targetName?: string;
  /** The configuration of the web-dev-server target. */
  targetConfig?: TargetConfiguration<
    Partial<RunCommandsOptions> & DevServerCliArgs
  >;
};

export const webDevServerConfigFileNameGlob =
  '**/@(web-dev-server|wds).config.@(js|cjs|mjs)';

export const webDevServerCommand = 'web-dev-server';

export const createNodes: CreateNodes<WebDevServerTargetPluginOptions> = [
  webDevServerConfigFileNameGlob,
  (webDevServerConfigPath, options, context) =>
    createWebDevServerTarget(webDevServerConfigPath, options, context),
];

export const createNodesV2: CreateNodesV2<WebDevServerTargetPluginOptions> = [
  webDevServerConfigFileNameGlob,
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
 * @param webDevServerConfigPath - Relative to `context.workspaceRoot` e.g
 *   `path/to/web-dev-server.config.js`
 * @param options
 * @param context
 * @returns
 */
const createWebDevServerTarget: CreateNodesFunction<
  WebDevServerTargetPluginOptions
> = (webDevServerConfigPath, options, context) => {
  const { targetName, targetConfig } = {
    targetName: 'serve',
    targetConfig: {},
    ...options,
  } satisfies Required<WebDevServerTargetPluginOptions>;

  const webDevServerConfigFileName = basename(webDevServerConfigPath);
  const webDevServerConfigDirectory = dirname(webDevServerConfigPath);

  if (!isNonRootProject(webDevServerConfigDirectory, context)) {
    return {};
  }

  const webDevServerConfig = {
    config: webDevServerConfigFileName,
    watch: true,
  } satisfies DevServerCliArgs;

  const inferredTargetConfig = {
    command: webDevServerCommand,
    ...targetConfig,
    options: {
      ...webDevServerConfig,
      cwd: '{projectRoot}',
      ...targetConfig.options,
    },
  } satisfies WebDevServerTargetPluginOptions['targetConfig'];

  return {
    projects: {
      [webDevServerConfigDirectory]: {
        targets: {
          [targetName]: inferredTargetConfig,
        },
      },
    },
  };
};

/**
 * @param directory - Relative to `context.workspaceRoot` e.g
 *   'path/to/directory'
 * @param context
 * @returns Whether the directory is considered a non root project.
 */
const isNonRootProject = (directory: string, context: CreateNodesContextV2) => {
  if (directory === '.') return false;

  return (
    existsSync(join(context.workspaceRoot, directory, 'project.json')) ||
    existsSync(join(context.workspaceRoot, directory, 'package.json'))
  );
};
