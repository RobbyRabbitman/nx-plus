import { workspaceRoot } from '@nx/devkit';
import {
  localRegistryTarget,
  publishTarget,
} from '@robby-rabbitman/nx-plus-tools-local-registry';
import { spawn } from 'child_process';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';
import { join } from 'path';

export async function setup() {
  const projectName = process.env['NX_TASK_TARGET_PROJECT'];
  const verbose = process.env['NX_VERBOSE_LOGGING'] === 'true';

  const project = readCachedProjectConfiguration(projectName);

  // const { stopLocalRegistry } = await publish({
  //   clearStorage: true,
  //   stopLocalRegistry: false,
  //   tag: 'local',
  //   specifier: '0.0.0-local',
  //   storage: join(
  //     workspaceRoot,
  //     'dist',
  //     'vite-local-registry-storage',
  //     project.root,
  //   ),
  //   projects: [],
  //   verbose,
  //   localRegistryTarget,
  // });

  const localRegistry = spawn(
    `pnpm exec nx run ${publishTarget}`,
    [
      `--tag=local`,
      `--specifier=0.0.0-local`,
      `--storage=${join(
        workspaceRoot,
        'dist',
        'vite-local-registry-storage',
        project.root,
      )}`,
      `stopLocalRegistry=false`,
      `clearStorage=true`,
      `localRegistryTarget=${localRegistryTarget}`,
      `verbose=${verbose}`,
    ],
    {
      cwd: workspaceRoot,
      stdio: 'inherit',
      env: process.env,
    },
  );

  global.stopLocalRegistry = () => localRegistry.kill();
}

export function teardown() {
  if (global.stopLocalRegistry) {
    global.stopLocalRegistry();
  }
}
