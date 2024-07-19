import { readJsonFile, workspaceRoot, writeJsonFile } from '@nx/devkit';
import { getRandomPort as getRandomPortUtil } from '@robby-rabbitman/nx-plus-libs-node-util';
import { rmSync } from 'fs';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';
import { join } from 'path';
import { lock } from 'proper-lockfile';

export const PORTS_FILE_PATH = join(
  workspaceRoot,
  readCachedProjectConfiguration('libs-e2e-util').root,
  'tmp',
  'ports.json',
);

/**
 * Removes the ports lockfile. It does **not** check, whether these ports are
 * actually in use.
 */
export function removePortsLockFile() {
  rmSync(PORTS_FILE_PATH, { force: true });
}

/**
 * The function uses a lock file, so e2e tests can run in parallel. After a e2e
 * test, the lock file should be removed.
 *
 * @returns A random unused port.
 */
export async function getRandomPort() {
  const portsFileLock = await lock(PORTS_FILE_PATH);

  const ports = readJsonFile<number[]>(PORTS_FILE_PATH);

  let port: number;

  while (port == null) {
    port = await getRandomPortUtil();
    if (ports.includes(port)) {
      port == null;
    }
  }

  ports.push(port);
  writeJsonFile(PORTS_FILE_PATH, ports);

  portsFileLock();

  return port;
}
