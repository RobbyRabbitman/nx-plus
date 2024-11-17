import { workspaceRoot } from '@nx/devkit';
import { execSync } from 'child_process';

export const VERDACCIO_URL = 'http://localhost:4873';

/** @returns `true` if Verdaccio is available, `false` otherwise. */
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
