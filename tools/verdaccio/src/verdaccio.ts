import { workspaceRoot } from '@nx/devkit';
import { execSync } from 'child_process';

export const VERDACCIO_URL = 'http://localhost:4433';

/**
 * Checks if the `Verdaccio` instance of this workspace is available.
 *
 * @see {@link VERDACCIO_URL}
 * @see {@link assertVerdaccioAvailable}
 */
export function isVerdaccioAvailable() {
  try {
    execSync(`pnpm ping --registry ${VERDACCIO_URL}`, {
      cwd: workspaceRoot,
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Asserts that the `Verdaccio` instance of this workspace is available.
 *
 * @see {@link VERDACCIO_URL}
 * @see {@link isVerdaccioAvailable}
 */
export function assertVerdaccioAvailable() {
  if (!isVerdaccioAvailable()) {
    throw new Error(
      `[assertVerdaccioAvailable] The Verdaccio instance of this workspace is not available at ${VERDACCIO_URL}.`,
    );
  }
}
