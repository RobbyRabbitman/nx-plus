import {
  type CreateNodesFunction,
  type CreateNodesV2,
  createNodesFromFiles,
} from '@nx/devkit';
import { dirname } from 'path';

/**
 * TODO: remove this project when https://github.com/nrwl/nx/issues/9748 is
 * fixed
 */

/** Represents the glob pattern to find all package.json files in the workspace. */
export const PACKAGE_JSON_GLOB = '**/package.json';

/** https://nx.dev/extending-nx/recipes/project-graph-plugins */
export const createNodesV2 = [
  PACKAGE_JSON_GLOB,
  (packageJsonPaths, schema, context) =>
    createNodesFromFiles(
      createEslintNxDependencyChecksPseudoBuildTarget,
      packageJsonPaths,
      schema,
      context,
    ),
] satisfies CreateNodesV2;

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
const createEslintNxDependencyChecksPseudoBuildTarget: CreateNodesFunction = (
  packageJsonPath,
) => {
  const packageJson = dirname(packageJsonPath);

  return {
    projects: {
      [packageJson]: {
        targets: {
          'eslint-nx-dependency-checks-pseudo-build': {
            command:
              "echo 'It seems like you called me - you should not. I am just a workaround for https://github.com/nrwl/nx/issues/9748' && exit 1",
          },
        },
      },
    },
  };
};
