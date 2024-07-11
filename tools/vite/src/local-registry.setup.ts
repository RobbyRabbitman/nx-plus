import { workspaceRoot } from '@nx/devkit';
import {
  localRegistryTarget,
  publish,
} from '@robby-rabbitman/nx-plus-tools-local-registry';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';
import { join } from 'path';

export async function setup() {
  const projectName = process.env['NX_TASK_TARGET_PROJECT'];
  const verbose = process.env['NX_VERBOSE_LOGGING'] === 'true';

  const project = readCachedProjectConfiguration(projectName);

  const { stopLocalRegistry } = await publish({
    clearStorage: true,
    stopLocalRegistry: false,
    tag: 'local',
    specifier: '0.0.0-local',
    storage: join(
      workspaceRoot,
      'dist',
      'vite-local-registry-storage',
      project.root,
    ),
    projects: [],
    verbose,
    localRegistryTarget,
  });

  global.stopLocalRegistry = stopLocalRegistry;
}

export function teardown() {
  if (!global.stopLocalRegistry) {
    throw new Error('Local registry stop callback expected to be defined O_O');
  }
  global.stopLocalRegistry();
}
