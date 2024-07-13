import { workspaceRoot } from '@nx/devkit';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph'; // this not public api?

/**
 * Creates a nx workspace in
 * `dist/e2e-workspace/{projectRoot}/{nxWorkspaceName}`
 *
 * - {projectRoot} <=> the path to the project root of the project identified by
 *   `e2eProjectName` relative to _this_ nx workspace root e.g.
 *   `path/to/e2e-project`
 *
 * @param options
 * @returns The workspace root of the created nx workspace.
 */
export const createE2eNxWorkspace = (options: {
  /**
   * The e2e project, for which a nx workspace should be created e.g.
   * `my-e2e-project`. Throws an error if _this_ nx workspace does find this
   * project.
   */
  e2eProjectName: string;
  /** The name of the new nx workspace. */
  e2eNxWorkspaceName: string;
  /** The version of the new nx workspace. */
  e2eNxVersion: string;
}) => {
  const { e2eProjectName, e2eNxVersion, e2eNxWorkspaceName } = options;

  const e2eProject = readCachedProjectConfiguration(e2eProjectName);

  const e2eNxWorkspaces = join(workspaceRoot, 'dist', 'e2e-workspace');

  const e2eNxWorkspacesOfProject = join(e2eNxWorkspaces, e2eProject.root);

  return createNxWorkspace({
    cwd: e2eNxWorkspacesOfProject,
    nxWorkspaceName: e2eNxWorkspaceName,
    nxVersion: e2eNxVersion,
  });
};

/**
 * Creates a nx workspace with `create-nx-workspace`.
 *
 * - Disables nx cloud
 *
 * @param options
 * @returns The workspace root of the created nx workspace.
 */
export const createNxWorkspace = (options: {
  /** The directory in which to execute `create-nx-workspace`. */
  cwd: string;
  /** The name of the workspace e.g. 'my-nx-workspace' */
  nxWorkspaceName: string;
  /**
   * The nx version to use, must be a valid npm version identifier =>
   * `create-nx-workspace@{nxVersion}`
   */
  nxVersion: string;
  /** Additional arguments for `create-nx-workspace`. */
  args?: string;
}) => {
  const { cwd, nxWorkspaceName, nxVersion, args } = options;

  const nxWorkspaceRoot = join(cwd, nxWorkspaceName);

  // make sure there is no directory.
  rmSync(nxWorkspaceRoot, {
    recursive: true,
  });

  // make the current working directory exists.
  mkdirSync(cwd, {
    recursive: true,
  });

  // always npx?
  execSync(
    `npx --yes create-nx-workspace@${nxVersion} ${nxWorkspaceName} --nxCloud skip --no-interactive ${args}`,
    {
      cwd: nxWorkspaceRoot,
      stdio: 'inherit',
    },
  );

  return nxWorkspaceRoot;
};
