import { readJsonFile, workspaceRoot, writeJsonFile } from '@nx/devkit';
import { getRandomPort as getRandomPortUtil } from '@robby-rabbitman/nx-plus-libs-node-util';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';
import { dirname, join } from 'path';
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
  if (!existsSync(PORTS_FILE_PATH)) {
    mkdirSync(dirname(PORTS_FILE_PATH), { recursive: true });
    writeJsonFile(PORTS_FILE_PATH, []);
  }

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

export async function releasePort(port: number) {
  if (!existsSync(PORTS_FILE_PATH)) {
    return;
  }

  const portsFileLock = await lock(PORTS_FILE_PATH);

  const ports = readJsonFile<number[]>(PORTS_FILE_PATH);

  const portIndex = ports.indexOf(port);

  if (portIndex === -1) {
    return;
  }

  ports.splice(portIndex, 1);

  writeJsonFile(PORTS_FILE_PATH, ports);

  portsFileLock();
}
