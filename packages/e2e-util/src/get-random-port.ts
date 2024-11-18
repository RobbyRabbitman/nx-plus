import { logger, readCachedProjectGraph, workspaceRoot } from '@nx/devkit';
import { getRandomPort as getRandomPortUtil } from '@robby-rabbitman/nx-plus-libs-node-util';
import { access, mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { lock } from 'proper-lockfile';

// TODO: maybe save the lock time and invalidate the lock after a certain time
// TODO: what if the process crashes or the functions with locks are not awaited and the lock is never released? Read more about proper-lockfile

/**
 * Locks a random port and returns it. The caller should release the port after
 * usage.
 *
 * @see {@link releasePort}
 */
export async function getRandomPort(options?: {
  maxRetries?: number;
  portsFilePath?: string;
}) {
  const maxRetries = Math.max(options?.maxRetries ?? 100, 1);

  let port: number | null = null;
  let retries = 0;

  await setPorts(async (ports) => {
    while (port == null && ++retries < maxRetries) {
      port = await getRandomPortUtil();
      // Check if the port is already locked => if so, unset it and try again
      if (ports.includes(port!)) {
        port = null;
      }
    }

    if (port == null) {
      throw new Error(`Could not find a free port after ${maxRetries} retries`);
    }

    return [...ports, port];
  }, options);

  return port;
}

export const PORTS_FILE_PATH = join(
  workspaceRoot,
  readCachedProjectGraph().nodes['libs-e2e-util']!.data.root,
  'tmp',
  'ports',
  'ports.json',
);

export async function getPorts(options?: { portsFilePath?: string }) {
  const portsFilePath = options?.portsFilePath ?? PORTS_FILE_PATH;
  try {
    const ports = JSON.parse(
      await readFile(portsFilePath, 'utf-8'),
    ) as number[];
    return ports;
  } catch {
    return [];
  }
}

export async function setPorts(
  updateFn: (currentPorts: number[]) => number[] | Promise<number[]>,
  options?: { portsFilePath?: string },
) {
  const portsFilePath = options?.portsFilePath ?? PORTS_FILE_PATH;
  const portsFileDir = dirname(portsFilePath);
  const portsFileDirExists = await access(portsFileDir)
    .then(() => true)
    .catch(() => false);

  if (!portsFileDirExists) {
    await mkdir(portsFileDir, { recursive: true });
  }

  const portsFileLock = await lock(portsFileDir, {
    lockfilePath: join(portsFileDir, 'dir.lock'),
    retries: { forever: true }, // TODO: this ok since a e2e test will timeout (?)
  });
  logger.verbose('Acquired ports file lock');

  try {
    const currentPorts = await getPorts(options);
    const ports = await updateFn(currentPorts);
    await writeFile(portsFilePath, JSON.stringify(ports));
  } finally {
    logger.verbose('Released ports file lock');
    await portsFileLock();
  }
}

/** @see {@link getRandomPort} */
export async function releasePort(
  port: number,
  options?: { portsFilePath?: string },
) {
  await setPorts((ports) => ports.filter((x) => x !== port), options);
}

/**
 * Releases all ports - new e2e targets could now get a port assigned that was
 * previously locked. It does **not** check, whether these ports were actually
 * in use.
 *
 * @see {@link getRandomPort}
 */
export async function releaseAllPorts(options?: { portsFilePath?: string }) {
  await setPorts(() => [], options);
}
