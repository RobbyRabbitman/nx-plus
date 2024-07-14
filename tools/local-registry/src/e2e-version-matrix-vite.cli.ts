import { getPackageManagerCommand, workspaceRoot } from '@nx/devkit';
import { execSync } from 'child_process';
import { rmSync } from 'fs';
import { join } from 'path';
import { localRegistryTarget, publish } from './publish';

async function main() {
  const verbose = process.env['NX_VERBOSE_LOGGING'] === 'true';

  if (verbose) {
    console.log('start registry and publish workspace');
  }

  const { stopLocalRegistry } = await publish({
    clearStorage: true,
    stopLocalRegistry: false,
    tag: 'local',
    specifier: '0.0.0-local',
    storage: join(workspaceRoot, 'dist', 'e2e-local-registry-storage'),
    projects: [],
    verbose,
    localRegistryTarget,
  });

  if (verbose) {
    console.log('published workspace');
  }

  try {
    if (verbose) {
      console.log('remove dist/e2e-workspace');
    }

    rmSync(join(workspaceRoot, 'dist', 'e2e-workspace'), {
      force: true,
      recursive: true,
    });

    if (verbose) {
      console.log('remove dist/e2e-workspace done');
    }

    const packageManagerCommand = getPackageManagerCommand();

    execSync(
      `NX_ISOLATE_PLUGINS=true ${packageManagerCommand.exec} nx affected -t e2e-version-matrix-vite --exclude tools-local-registry`,
      { cwd: workspaceRoot, stdio: 'inherit', env: process.env },
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    stopLocalRegistry();
  }
  process.exit();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
