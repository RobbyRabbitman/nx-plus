import { logger } from '@nx/devkit';
import { dirname, join } from 'path';
import { lock } from 'proper-lockfile';
import { describe, expect, vi } from 'vitest';
import { getPorts, getPortsFilePath, setPorts } from './get-random-port.js';

describe('[Integration Test] getRandomPort', () => {
  /** https://github.com/moxystudio/node-proper-lockfile/blob/9f8c303c91998e8404a911dc11c54029812bca69/test/lock.test.js#L117C1-L125C4 */
  it('should respect the lock on the ports file', async () => {
    await setPorts(() => [1, 2, 3]);
    await expect(getPorts()).resolves.toEqual([1, 2, 3]);

    /** Need to lock the same directory as the setPorts function. */
    const unlockPortsFile = await lock(dirname(getPortsFilePath()), {
      lockfilePath: join(dirname(getPortsFilePath()), 'dir.lock'),
    });

    vi.spyOn(logger, 'verbose');

    setTimeout(() => {
      expect(logger.verbose).toHaveBeenCalledWith(
        '[setPorts] getting ports file lock...',
      );
      expect(logger.verbose).not.toHaveBeenCalledWith(
        '[setPorts] acquired ports file lock',
      );
      unlockPortsFile();
    }, 1000);

    await setPorts((ports) => [...ports, 4]);

    expect(logger.verbose).toHaveBeenCalledWith(
      '[setPorts] acquired ports file lock',
    );
    expect(logger.verbose).toHaveBeenCalledWith(
      '[setPorts] released ports file lock',
    );
    await expect(getPorts()).resolves.toEqual([1, 2, 3, 4]);
  });
});
