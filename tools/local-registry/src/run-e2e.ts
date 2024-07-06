import { getPackageManagerCommand, workspaceRoot } from '@nx/devkit';
import { execSync } from 'child_process';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';
import { join } from 'path';
import { publish } from './publish';

export const runE2e = async (options: {
  e2eProjectName: string;
  e2eTarget: string;
}) => {
  const { e2eProjectName, e2eTarget } = options;

  const e2eProject = readCachedProjectConfiguration(e2eProjectName);

  const { stopLocalRegistry } = await publish({
    clearStorage: true,
    stopLocalRegistry: false,
    tag: 'e2e',
    specifier: '0.0.0-e2e',
    storage: join(workspaceRoot, 'dist', 'e2e-storage', e2eProject.root),
    projects: [],
    verbose: true,
    localRegistryTarget: 'tools-local-registry:serve',
  });

  try {
    execSync(
      `${getPackageManagerCommand().exec} nx run ${e2eProjectName}:${e2eTarget}`,
      { stdio: 'inherit', cwd: workspaceRoot },
    );
  } finally {
    stopLocalRegistry();
  }
};
