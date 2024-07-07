import {
  CreateNodesFunction,
  CreateNodesV2,
  ProjectConfiguration,
  createNodesFromFiles,
  getPackageManagerCommand,
  readCachedProjectGraph,
  readJsonFile,
} from '@nx/devkit';
import { dirname, join } from 'node:path';

const nxRunCommandsExecutor = 'nx:run-commands';
const packageManagerCommand = getPackageManagerCommand();

export type RunTestPluginOptions = {
  /** The name of the test target this plugin will create. */
  targetName?: string;
  /** The test targets this plugin should wrap. */
  targetRegex?: string;
};

const nxProjectGlob = '**/project.json';
const defaultTargetName = 'test';
const defaultTargetRegex = '^test-';

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
> = (webTestRunnerConfigPath, options, context) => {
  const { targetName, targetRegex } = {
    targetName: defaultTargetName,
    targetRegex: defaultTargetRegex,
    ...options,
  } satisfies RunTestPluginOptions;

  const projectRoot = dirname(webTestRunnerConfigPath);

  const projectJson = readJsonFile<ProjectConfiguration>(
    join(context.workspaceRoot, projectRoot, 'project.json'),
  );

  const project = readCachedProjectGraph().nodes[projectJson.name];
  const projectTargets = Object.keys(project.data.targets);

  const testTargets = projectTargets.filter((target) =>
    target.match(targetRegex),
  );

  if (testTargets.length === 0) {
    return;
  }

  const commands = testTargets.map(
    (target) =>
      `${packageManagerCommand.exec} nx run ${project.name}:${target}`,
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
