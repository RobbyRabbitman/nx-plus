import { readJsonFile, workspaceRoot, writeJsonFile } from '@nx/devkit';
import { getRandomPort as getRandomPortUtil } from '@robby-rabbitman/nx-plus-libs-node-util';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';
import { join } from 'path';
import { lock } from 'proper-lockfile';

export const PORTS_FILE_PATH = join(
  workspaceRoot,
  readCachedProjectConfiguration('libs-e2e-util').root,
  'tmp',
  'ports.json',
);

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
