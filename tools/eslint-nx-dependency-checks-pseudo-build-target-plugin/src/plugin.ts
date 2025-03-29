import {
  type CreateNodesFunction,
  type CreateNodesV2,
  createNodesFromFiles,
} from '@nx/devkit';
import { dirname } from 'path';

/**
 * TODO: remove this plugin when https://github.com/nrwl/nx/issues/9748 is
 * fixed.
 */

/**
 * Represents a glob pattern to find all projects in the workspace so that every
 * project gets a pseudo build target.
 */
export const ALL_PROJECTS_GLOB = '**/package.json';

/** https://nx.dev/extending-nx/recipes/project-graph-plugins */
export const createNodesV2 = [
  ALL_PROJECTS_GLOB,
  (packageJsonPaths, options, context) =>
    createNodesFromFiles(
      createNxDependencyChecksPseudoBuildTarget,
      packageJsonPaths,
      options,
      context,
    ),
] satisfies CreateNodesV2<void>;

export const PSEUDO_BUILD_TARGET_NAME =
  'eslint-nx-dependency-checks-pseudo-build';

/**
 * The eslint rule `@nx/dependency-checks` requires a build target name to find
 * the dependencies of a project. Every dependency must have exactly the
 * **same** built target name. This function creates a pseudo build target for
 * every project so that the rule can actually find the dependencies and report
 * potential issues when there are different build target names used within the
 * workspace.
 *
 * https://github.com/nrwl/nx/blob/19b0828d278b5fa8e3d9f8fc537b317c7f442848/packages/eslint-plugin/src/rules/dependency-checks.ts#L145C7-L145C96
 */
const createNxDependencyChecksPseudoBuildTarget: CreateNodesFunction<void> = (
  packageJsonPath,
) => {
  const packageJson = dirname(packageJsonPath);

  return {
    projects: {
      [packageJson]: {
        targets: {
          [PSEUDO_BUILD_TARGET_NAME]: {
            command:
              "echo 'It seems like you called me - you should not. I am just a workaround for https://github.com/nrwl/nx/issues/9748' && exit 1",
          },
        },
      },
    },
  };
};
