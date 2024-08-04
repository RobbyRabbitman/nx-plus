import { workspaceRoot } from '@nx/devkit';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';
import { join } from 'path';
import { mergeConfig, UserConfig } from 'vitest/config';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { getNxEnvVar } from '@robby-rabbitman/nx-plus-libs-nx-util';
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
  const projectName = getNxEnvVar('NX_TASK_TARGET_PROJECT');
  const verbose = getNxEnvVar('NX_VERBOSE_LOGGING') === 'true';

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
