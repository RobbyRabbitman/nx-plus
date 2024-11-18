import { logger, readCachedProjectGraph, workspaceRoot } from '@nx/devkit';
import { getRandomPort as getRandomPortUtil } from '@robby-rabbitman/nx-plus-node-util';
import { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { lock } from 'proper-lockfile';

/**
 * Locks a random port and returns it. The caller should release the port after
 * usage - if the port is not released, it will not be available ever again,
 * because this function does not track whether the port is actually in use.
 *
 * @see {@link releasePort}
 */
export async function getRandomPort(options?: {
  maxRetries?: number;
  portsFilePath?: string;
}) {
  const maxRetries = Math.max(1, Math.min(options?.maxRetries ?? 100, 100));

  let port: number | null = null;
  let retries = 0;

  await setPorts(async (ports) => {
    while (port == null && ++retries < maxRetries) {
      port = await getRandomPortUtil();
      // Check if the port is already locked => if so, unset it and try again
      if (ports.includes(port)) {
        port = null;
      }
    }

    if (port == null) {
      throw new Error(
        `[getRandomPort] Could not find a free port after ${maxRetries} retries`,
      );
    }

    return [...ports, port];
  }, options);

  return port as unknown as number;
}

export const getPortsFilePath = () => {
  const nodeE2eUtilProject = readCachedProjectGraph().nodes['node-e2e-util'];

  if (!nodeE2eUtilProject) {
    throw new Error(
      '[getPortsFilePath] node-e2e-util project not found in the project graph',
    );
  }

  return join(
    workspaceRoot,
    nodeE2eUtilProject.data.root,
    'tmp',
    'ports',
    'ports.json',
  );
};

/**
 * @returns The ports that are currently locked - gracefully handles missing
 *   files or invalid JSON in the case when the file _is_ not a ports file
 *   because this function should only be used in a e2e test context.
 * @see {@link getRandomPort}
 * @see {@link setPorts}
 */
export async function getPorts(options?: { portsFilePath?: string }) {
  const portsFilePath = options?.portsFilePath ?? getPortsFilePath();

  try {
    const ports = JSON.parse(
      await readFile(portsFilePath, 'utf-8'),
    ) as number[];

    return ports;
  } catch {
    return [];
  }
}

/**
 * Sets the ports to the result of the given function. The function should
 * return the new ports based on the current ports. Handles gracefully missing
 * files or invalid JSON because this function should only be used in a e2e test
 * context. Overrides the the given ports file with the new ports - it does not
 * check whether the ports are in use or if the file _is_ a ports file.
 *
 * @see {@link getRandomPort}
 */
export async function setPorts(
  setFn: (currentPorts: number[]) => number[] | Promise<number[]>,
  options?: { portsFilePath?: string },
) {
  const portsFilePath = options?.portsFilePath ?? getPortsFilePath();
  const portsFileDir = dirname(portsFilePath);
  const portsFileDirExists = existsSync(portsFileDir);

  if (!portsFileDirExists) {
    await mkdir(portsFileDir, { recursive: true });
  }

  logger.verbose('[setPorts] getting ports file lock...');

  // NOTE: proper-lockfile has a graceful exit behavior by default - https://github.com/moxystudio/node-proper-lockfile?tab=readme-ov-file#graceful-exit
  const unlockPortsFile = await lock(portsFileDir, {
    lockfilePath: join(portsFileDir, 'dir.lock'),
    retries: {
      // NOTE: this ok since a e2e test will timeout if the lock is not acquired
      // TODO: what if the e2e has no timeout?
      forever: true,
    },
  });
  logger.verbose('[setPorts] acquired ports file lock');

  try {
    const currentPorts = await getPorts(options);
    const ports = await setFn(currentPorts);

    /**
     * TODO: should we catch stringification errors and report a clearer error
     * message?
     */
    await writeFile(portsFilePath, JSON.stringify(ports));
  } finally {
    logger.verbose('[setPorts] released ports file lock');
    await unlockPortsFile();
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
