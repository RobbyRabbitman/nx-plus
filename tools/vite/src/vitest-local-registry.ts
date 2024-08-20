import { readCachedProjectGraph, workspaceRoot } from '@nx/devkit';
import { join } from 'path';
import { mergeConfig, UserConfig } from 'vitest/config';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { localRegistryTarget, publish } from '../../local-registry';

export function localRegistry(overrides?: Partial<UserConfig>) {
  return mergeConfig(
    {
      test: {
        globalSetup: [
          join(workspaceRoot, 'tools/vite/src/vitest-local-registry.ts'),
        ],
      },
    },
    overrides ?? {},
  );
}

export async function setup() {
  const projectName = process.env['NX_TASK_TARGET_PROJECT'];
  const verbose = process.env['NX_VERBOSE_LOGGING'] === 'true';

  const project = readCachedProjectGraph().nodes[projectName].data;

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
