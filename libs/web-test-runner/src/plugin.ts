import {
  CreateNodesFunction,
  CreateNodesV2,
  createNodesFromFiles,
  getPackageManagerCommand,
} from '@nx/devkit';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

type WebTestRunnerTargetPluginOptions = { targetName: string };

const webTestRunnerConfigFileNameGlob = '**/wtr.config.@(js|cjs|mjs)';

const packageManagerCommand = getPackageManagerCommand();

const defaultTargetName = 'test';

/**
 * In `targets` in a `project.json`, nx replaces this symbol with the relative path to the project from the workspace root.
 */
const projectRootSymbol = '{projectRoot}';

export const createNodesV2: CreateNodesV2<WebTestRunnerTargetPluginOptions> = [
  webTestRunnerConfigFileNameGlob,
  (webTestRunnerConfigFileNames, options, context) => {
    return createNodesFromFiles(
      createWebTestRunnerTarget,
      webTestRunnerConfigFileNames,
      options,
      context
    );
  },
];

const createWebTestRunnerTarget: CreateNodesFunction = (
  webTestRunnerConfigFileName: string,
  options: WebTestRunnerTargetPluginOptions
) => {
  const webTestRunnerConfigDirectory = dirname(webTestRunnerConfigFileName);

  const isWebTestRunnerConfigInProject = isProject(
    webTestRunnerConfigDirectory
  );

  // make sure the config is in a project: a user may have a shared config located e.g. in the root of the workspace which matches the `wtrConfigFileNameRegEx`
  if (!isWebTestRunnerConfigInProject) {
    return {};
  }

  const targetName = options?.targetName ?? defaultTargetName;

  return {
    projects: {
      [webTestRunnerConfigDirectory]: {
        targets: {
          [targetName]: {
            command: `${packageManagerCommand.exec} wtr --config=${webTestRunnerConfigFileNameGlob}`,
            options: {
              cwd: `${projectRootSymbol}`,
            },
          },
        },
      },
    },
  };
};

/**
 *
 * @param directory
 * @returns whether the directory is considered a nx project.
 */
const isProject = (directory: string) => {
  return (
    existsSync(join(directory, 'project.json')) ||
    existsSync(join(directory, 'package.json'))
  );
};
