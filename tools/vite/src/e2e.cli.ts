import { getPackageManagerCommand, workspaceRoot } from '@nx/devkit';
import {
  localRegistryTarget,
  publish,
} from '@robby-rabbitman/nx-plus-tools-local-registry';
import { execSync } from 'child_process';
import { join } from 'path';

async function main() {
  const verbose = process.env['NX_VERBOSE_LOGGING'] === 'true';

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

  try {
    const packageManagerCommand = getPackageManagerCommand();

    execSync(
      `${packageManagerCommand.exec} nx affected -t e2e-version-matrix-vite`,
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    stopLocalRegistry();
  }
  process.exit();
}

main();
