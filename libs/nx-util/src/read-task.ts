import { readCachedProjectGraph, type ProjectConfiguration } from '@nx/devkit';

interface NxTask {
  project: ProjectConfiguration;
  projectName: string;
  target: string;
  configuration: string;
  dryRun: boolean;
  isInteractive: boolean;
}

/**
 * Returns information about the current nx task being run.
 *
 * - ProjectName: The name of the project the task is running for.
 * - Target: The name of the task.
 * - Configuration: The configuration of the task.
 * - DryRun: Whether the task is running in dry-run mode.
 * - IsInteractive: Whether the task is running in interactive mode.
 *
 * @see {@link https://nx.dev/reference/environment-variables}
 */
export function readNxTask(options?: { assertNxTask: true }): NxTask;
export function readNxTask(options?: {
  assertNxTask: false;
}): NxTask | undefined;
export function readNxTask(options?: {
  assertNxTask: boolean;
}): NxTask | undefined {
  const defaultOptions = {
    assertNxTask: true,
  };

  const normalizedOptions = {
    ...defaultOptions,
    ...options,
  };

  const projectName = process.env.NX_TASK_TARGET_PROJECT;

  /** This is not a nx task. */
  if (projectName === undefined) {
    if (normalizedOptions.assertNxTask) {
      throw new Error(
        `[readNxTask] Could not find 'NX_TASK_TARGET_PROJECT' in the environment variables - this seems not to be a nx task.`,
      );
    }

    return;
  }

  const project = readCachedProjectGraph().nodes[projectName]?.data;

  if (!project) {
    throw new Error(
      `[readNxTask] Could not find the project '${projectName}' in this nx workspace. Try run 'nx reset' to reset the project graph.`,
    );
  }

  return {
    project,
    projectName,
    target: process.env.NX_TASK_TARGET_TARGET as string,
    configuration: process.env.NX_TASK_TARGET_CONFIGURATION as string,
    dryRun: process.env.NX_DRY_RUN === 'true',
    isInteractive: process.env.NX_INTERACTIVE === 'true',
  };
}
