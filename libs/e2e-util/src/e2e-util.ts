import { workspaceRoot } from '@nx/devkit';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';

export const createE2eWorkspace = (options: {
  e2eProjectName: string;
  nxVersion: string;
}) => {
  const { e2eProjectName, nxVersion } = options;

  const e2eProject = readCachedProjectConfiguration(e2eProjectName);

  const e2eProjectRoot = join(
    workspaceRoot,
    'dist',
    'e2e-workspace',
    e2eProject.root,
  );

  return createWorkspace({
    projectRoot: e2eProjectRoot,
    nxVersion,
  });
};

/**
 * @param options
 * @returns Creates a nx workspace with the provided version, uses npm.
 */
export const createWorkspace = (options: {
  /**
   * The project root, e.g the current project which executes e2e tests
   * `e2e/path/to/project`
   */
  projectRoot: string;
  /** The nx version to use, must be a valid npm version identifier */
  nxVersion: string;
}) => {
  const { projectRoot, nxVersion } = options;

  const workspaceName = `${projectRoot.split('/').pop()}-${nxVersion}`;

  const workspaceRoot = join(projectRoot, workspaceName);

  rmSync(workspaceRoot, {
    recursive: true,
    force: true,
  });

  mkdirSync(projectRoot, {
    recursive: true,
  });

  execSync(
    `npx --yes create-nx-workspace@${nxVersion} ${workspaceName} --preset apps --nxCloud skip --no-interactive`,
    {
      cwd: projectRoot,
      stdio: 'inherit',
      env: process.env,
    },
  );

  return {
    workspaceRoot,
    nxVersion,
  };
};
