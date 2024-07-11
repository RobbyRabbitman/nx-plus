import {
  CreateNodes,
  CreateNodesContextV2,
  CreateNodesFunction,
  CreateNodesV2,
  createNodesFromFiles,
} from '@nx/devkit';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type WebDevServerTargetPluginOptions = {
  /** The name of the web-dev-server target. */
  targetName?: string;
};

export const webDevServerConfigFileNameGlob =
  '**/@(web-dev-server|wds).config.@(js|cjs|mjs)';

export const webDevServerCommand = 'web-dev-server';

export const defaultOptions = {
  targetName: 'serve',
} satisfies Required<WebDevServerTargetPluginOptions>;

export const createNodes: CreateNodes<WebDevServerTargetPluginOptions> = [
  webDevServerConfigFileNameGlob,
  (webDevServerConfigPath, options, context) =>
    createWebDevServerTarget(
      webDevServerConfigPath,
      { ...defaultOptions, ...options },
      context,
    ),
];

export const createNodesV2: CreateNodesV2<WebDevServerTargetPluginOptions> = [
  webDevServerConfigFileNameGlob,
  (webDevServerConfigPaths, options, context) => {
    return createNodesFromFiles(
      createWebDevServerTarget,
      webDevServerConfigPaths,
      { ...defaultOptions, ...options },
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
  Required<WebDevServerTargetPluginOptions>
> = (webDevServerConfigPath, options, context) => {
  const { targetName } = options;

  const webDevServerConfigDirectory = dirname(webDevServerConfigPath);

  if (!isNonRootProject(webDevServerConfigDirectory, context)) {
    return {};
  }

  return {
    projects: {
      [webDevServerConfigDirectory]: {
        targets: {
          [targetName]: {
            command: `${webDevServerCommand} --config=${webDevServerConfigPath}`,
          },
        },
      },
    },
  };
};

/**
 * @param directory - Relative to `context.workspaceRoot` e.g path/to/directory
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
