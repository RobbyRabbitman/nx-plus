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
    e2eProjectRoot,
    nxVersion,
  });
};

/**
 * @param options
 * @returns Creates a nx workspace with npm
 */
export const createWorkspace = (options: {
  e2eProjectRoot: string;
  nxVersion: string;
}) => {
  const { e2eProjectRoot, nxVersion } = options;

  const workspaceName = `${e2eProjectRoot.split('/').pop()}-${nxVersion}`;

  const workspaceRoot = join(e2eProjectRoot, workspaceName);

  rmSync(workspaceRoot, {
    recursive: true,
    force: true,
  });

  mkdirSync(e2eProjectRoot, {
    recursive: true,
  });

  execSync(
    `npx --yes create-nx-workspace@${nxVersion} ${workspaceName} --preset apps --nxCloud skip --no-interactive`,
    {
      cwd: e2eProjectRoot,
      stdio: 'inherit',
      env: process.env,
    },
  );

  return {
    workspaceRoot,
    nxVersion,
  };
};
