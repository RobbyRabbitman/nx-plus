import {
  CreateNodesFunction,
  CreateNodesV2,
  ProjectConfiguration,
  createNodesFromFiles,
  getPackageManagerCommand,
} from '@nx/devkit';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';

const nxRunCommandsExecutor = 'nx:run-commands';
const packageManagerCommand = getPackageManagerCommand();

export type RunTestPluginOptions = {
  /** The name of the test target this plugin will create. */
  targetName?: string;
  /** The test targets this plugin should wrap. */
  targetRegex?: string | RegExp;
};

const nxProjectGlob = '**/project.json';
const defaultTargetName = 'run-test';
const defaultTargetRegex = /^test(?:-.*)?$/;

export const createNodesV2: CreateNodesV2<RunTestPluginOptions> = [
  nxProjectGlob,
  (nxProjectPath, options, context) => {
    return createNodesFromFiles(
      createRunTestTarget,
      nxProjectPath,
      options,
      context,
    );
  },
];

const createRunTestTarget: CreateNodesFunction<
  RunTestPluginOptions | undefined
> = (nxProjectPath, options, context) => {
  const { targetName, targetRegex } = {
    targetName: defaultTargetName,
    targetRegex: defaultTargetRegex,
    ...options,
  } satisfies RunTestPluginOptions;

  const projectRoot = dirname(nxProjectPath);

  const projectJson = JSON.parse(
    readFileSync(join(context.workspaceRoot, projectRoot, 'project.json'), {
      encoding: 'utf-8',
    }),
  ) as ProjectConfiguration;

  if (!projectJson?.name) {
    return {};
  }

  const projectConfiguration = readCachedProjectConfiguration(projectJson.name);

  const projectTargets = Object.keys(projectConfiguration.targets ?? {});

  const testTargets = projectTargets.filter((target) =>
    target.match(targetRegex),
  );

  if (testTargets.length === 0) {
    return {};
  }

  const commands = testTargets.map(
    (target) =>
      `${packageManagerCommand.exec} nx run ${projectJson.name}:${target}`,
  );

  return {
    projects: {
      [projectRoot]: {
        targets: {
          [targetName]: {
            executor: nxRunCommandsExecutor,
            options: {
              commands,
            },
          },
        },
      },
    },
  };
};
