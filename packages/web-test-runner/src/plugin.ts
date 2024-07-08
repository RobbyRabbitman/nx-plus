import {
  CreateNodes,
  CreateNodesContextV2,
  CreateNodesFunction,
  CreateNodesV2,
  createNodesFromFiles,
} from '@nx/devkit';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type WebTestRunnerTargetPluginOptions = {
  /** The name of the web-test-runner target */
  targetName?: string;
};

export const webTestRunnerConfigFileNameGlob =
  '**/@(web-test-runner|wtr).config.@(js|cjs|mjs)';

export const webTestRunnerCommand = 'web-test-runner';

export const defaultOptions = {
  targetName: 'test',
} satisfies Required<WebTestRunnerTargetPluginOptions>;

export const createNodes: CreateNodes<WebTestRunnerTargetPluginOptions> = [
  webTestRunnerConfigFileNameGlob,
  (webTestRunnerConfigPath, options, context) =>
    createWebTestRunnerTarget(
      webTestRunnerConfigPath,
      { ...defaultOptions, ...options },
      context,
    ),
];

export const createNodesV2: CreateNodesV2<WebTestRunnerTargetPluginOptions> = [
  webTestRunnerConfigFileNameGlob,
  (webTestRunnerConfigPaths, options, context) => {
    return createNodesFromFiles(
      createWebTestRunnerTarget,
      webTestRunnerConfigPaths,
      { ...defaultOptions, ...options },
      context,
    );
  },
];

/**
 * @param webTestRunnerConfigPath - Relative to `context.workspaceRoot` e.g
 *   `path/to/web-test-runner.config.js`
 * @param options
 * @param context
 * @returns
 */
const createWebTestRunnerTarget: CreateNodesFunction<
  Required<WebTestRunnerTargetPluginOptions>
> = (webTestRunnerConfigPath, options, context) => {
  const { targetName } = options;
  const webTestRunnerConfigDirectory = dirname(webTestRunnerConfigPath);

  if (!isNonRootProject(webTestRunnerConfigDirectory, context)) {
    return {};
  }

  return {
    projects: {
      [webTestRunnerConfigDirectory]: {
        targets: {
          [targetName]: {
            command: `${webTestRunnerCommand} --config=${webTestRunnerConfigPath}`,
          },
        },
      },
    },
  };
};

/**
 * @param directory - Relative to `context.workspaceRoot` e.g
 *   `path/to/directory`
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
