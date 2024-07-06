import { workspaceRoot } from '@nx/devkit';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';

export const createE2eWorkspace = (options: { e2eProjectName: string }) => {
  const { e2eProjectName } = options;

  const e2eProject = readCachedProjectConfiguration(e2eProjectName);

  const e2eWorkspaceRoot = join(
    workspaceRoot,
    'dist',
    'e2e-workspace',
    e2eProject.root,
  );

  return createWorkspace({
    workspaceRoot: e2eWorkspaceRoot,
  });
};

/**
 * @param options
 * @returns Creates a nx workspace with npm
 */
export const createWorkspace = (options: { workspaceRoot: string }) => {
  const { workspaceRoot } = options;

  const workspaceName = workspaceRoot.split('/').pop();

  rmSync(workspaceRoot, {
    recursive: true,
    force: true,
  });

  mkdirSync(dirname(workspaceRoot), {
    recursive: true,
  });

  execSync(
    `npx --yes create-nx-workspace@latest ${workspaceName} --preset apps --nxCloud skip --no-interactive`,
    {
      cwd: dirname(workspaceRoot),
      stdio: 'inherit',
      env: process.env,
    },
  );

  return options;
};
