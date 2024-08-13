import { describe, expect, it } from 'vitest';
import { getPorts, getRandomPort, releasePort } from './get-random-port';

// I guess don't mock the fs, since the actual fs should be tested right (?)

describe('getRandomPort', { timeout: 30_000 }, () => {
  it('should return unique ports', async () => {
    const processes = 3;

    const ports = await Promise.all(
      Array.from({ length: processes }, getRandomPort),
    );

    // since we dont know if other tests are running and we use the real fs
    // maybe add a path option
    expect(new Set(ports).size).toBeGreaterThanOrEqual(processes);
  });

  describe('releasePort', () => {
    it('should remove the port from the ports file', async () => {
      const port = await getRandomPort();

      expect(await getPorts()).toContain(port);

      await releasePort(port);

      expect(await getPorts()).not.toContain(port);
    });
  });
});
