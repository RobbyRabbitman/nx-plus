import {
  CreateNodesContextV2,
  CreateNodesFunction,
  CreateNodesV2,
  createNodesFromFiles,
  getPackageManagerCommand,
} from '@nx/devkit';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type WebTestRunnerTargetPluginOptions = {
  /** The name of the web-test-runner target */
  targetName?: string;
};

const webTestRunnerConfigFileNameGlob =
  '**/@(web-test-runner|wtr).config.@(js|cjs|mjs)';

const webTestRunnerCommand = 'wtr';

const packageManagerCommand = getPackageManagerCommand();

const defaultTargetName = 'test';

export const createNodesV2: CreateNodesV2<WebTestRunnerTargetPluginOptions> = [
  webTestRunnerConfigFileNameGlob,
  (webTestRunnerConfigPaths, options, context) => {
    return createNodesFromFiles(
      createWebTestRunnerTarget,
      webTestRunnerConfigPaths,
      options,
      context
    );
  },
];

/**
 *
 * @param webTestRunnerConfigPath - relative to `context.workspaceRoot` e.g path/to/wtr.config.js
 * @param options
 * @param context
 * @returns
 */
const createWebTestRunnerTarget: CreateNodesFunction<
  WebTestRunnerTargetPluginOptions | undefined
> = (webTestRunnerConfigPath, options, context) => {
  const webTestRunnerConfigDirectory = dirname(webTestRunnerConfigPath);

  if (!isNonRootProject(webTestRunnerConfigDirectory, context)) {
    return {};
  }

  const targetName = options?.targetName ?? defaultTargetName;

  return {
    projects: {
      [webTestRunnerConfigDirectory]: {
        targets: {
          [targetName]: {
            command: `${packageManagerCommand.exec} ${webTestRunnerCommand} --config=${webTestRunnerConfigPath}`,
          },
        },
      },
    },
  };
};

/**
 *
 * @param directory - relative to `context.workspaceRoot` e.g path/to/directory
 * @param context
 * @returns whether the directory is considered a non root project.
 */
const isNonRootProject = (directory: string, context: CreateNodesContextV2) => {
  if (directory === '.') return false;

  return (
    existsSync(join(context.workspaceRoot, directory, 'project.json')) ||
    existsSync(join(context.workspaceRoot, directory, 'package.json'))
  );
};
