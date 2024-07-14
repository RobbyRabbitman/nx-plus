import { getPackageManagerCommand, workspaceRoot } from '@nx/devkit';
import { exec, execSync } from 'child_process';
import { join } from 'path';

async function main() {
  const localRegistryTarget = 'tools-local-registry:serve';
  const localRegistry = exec(
    `pnpm exec nx run tools-local-registry --clearStorage true --stopLocalRegistry false --tag 'local' --specifier '0.0.0-local' --storage ${join(workspaceRoot, 'dist', 'e2e-local-registry-storage')} --localRegistryTarget ${localRegistryTarget}`,
    { env: process.env },
  );

  try {
    const packageManagerCommand = getPackageManagerCommand();

    execSync(
      `${packageManagerCommand.exec} nx affected -t e2e-version-matrix-vite`,
      { env: process.env, stdio: 'inherit' },
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    if (!localRegistry.killed) {
      localRegistry.kill();
    }
  }
  process.exit();
}

main();
