import { workspaceRoot } from '@nx/devkit';
import { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { vol } from 'memfs';
import { dirname } from 'path';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import {
  getPorts,
  getPortsFilePath,
  getRandomPort,
  releaseAllPorts,
  releasePort,
  setPorts,
} from './get-random-port.js';

vi.mock('@nx/devkit', () => ({
  workspaceRoot: '/mock-workspace',
  logger: {
    verbose: vi.fn(),
  },
  readCachedProjectGraph: vi.fn().mockReturnValue({
    dependencies: {},
    nodes: {
      'node-e2e-util': {
        name: 'node-e2e-util',
        type: 'lib',
        data: {
          root: 'node/e2e-util',
        },
      },
    },
  }),
}));

vi.mock('fs', async () => {
  const memfs = await vi.importActual<typeof import('memfs')>('memfs');

  return memfs.fs;
});

vi.mock('fs/promises', async () => {
  const memfs = await vi.importActual<typeof import('memfs')>('memfs');

  return memfs.fs.promises;
});

vi.mock('proper-lockfile', () => ({
  lock: vi.fn(() => () => undefined),
}));

vi.mock('@robby-rabbitman/nx-plus-node-util', () => ({
  getRandomPort: vi.fn(() => 1),
}));

describe('[Unit Test] getRandomPort', () => {
  beforeEach(() => {
    vol.fromJSON({}, workspaceRoot);
  });

  afterEach(() => {
    vol.reset();
  });

  describe('should track acquired ports', () => {
    it("in a file 'ports.json' in the project's 'tmp/ports' directory", async () => {
      expect(getPortsFilePath()).toBe(
        '/mock-workspace/node/e2e-util/tmp/ports/ports.json',
      );
    });
  });

  describe('when releasing all ports', () => {
    it('should remove all ports from the file', async () => {
      await mkdir(dirname(getPortsFilePath()), { recursive: true });
      await writeFile(getPortsFilePath(), JSON.stringify([1, 2]), {
        encoding: 'utf-8',
      });

      await releaseAllPorts();

      await expect(
        readFile(getPortsFilePath(), {
          encoding: 'utf-8',
        }),
      ).resolves.toEqual('[]');
    });
  });

  describe('when releasing a port', () => {
    it('should remove the port from the file', async () => {
      await mkdir(dirname(getPortsFilePath()), { recursive: true });
      await writeFile(getPortsFilePath(), JSON.stringify([1, 2]), {
        encoding: 'utf-8',
      });

      await releasePort(1);

      await expect(
        readFile(getPortsFilePath(), {
          encoding: 'utf-8',
        }),
      ).resolves.toEqual('[2]');

      await releasePort(2);

      await expect(
        readFile(getPortsFilePath(), {
          encoding: 'utf-8',
        }),
      ).resolves.toEqual('[]');
    });

    it("should not throw if the port doesn't exist in the file", async () => {
      await mkdir(dirname(getPortsFilePath()), { recursive: true });
      await writeFile(getPortsFilePath(), JSON.stringify([1, 2]), {
        encoding: 'utf-8',
      });

      await expect(releasePort(3)).resolves.not.toThrow();
    });
  });

  describe('when getting the ports', () => {
    it('should return an empty list if the file does not exist', async () => {
      await expect(
        getPorts({ portsFilePath: 'non-existing-file' }),
      ).resolves.toEqual([]);
    });

    it('should return an empty list if the file is not a ports file', async () => {
      await mkdir(dirname(getPortsFilePath()), { recursive: true });
      await writeFile(getPortsFilePath(), 'invalid-json', {
        encoding: 'utf-8',
      });

      await expect(getPorts()).resolves.toEqual([]);
    });

    it('should return the ports from the file', async () => {
      await mkdir(dirname(getPortsFilePath()), { recursive: true });
      await writeFile(getPortsFilePath(), JSON.stringify([1, 2]), {
        encoding: 'utf-8',
      });

      await expect(getPorts()).resolves.toEqual([1, 2]);
    });
  });

  describe('when setting the ports', () => {
    it('should create the file if it does not exist', async () => {
      expect(existsSync(getPortsFilePath())).toBe(false);

      await setPorts(() => [1, 2, 3]);

      await expect(
        readFile(getPortsFilePath(), { encoding: 'utf-8' }),
      ).resolves.toEqual('[1,2,3]');
    });

    it('should set the file with the new ports', async () => {
      await mkdir(dirname(getPortsFilePath()), { recursive: true });
      await writeFile(getPortsFilePath(), JSON.stringify([1, 2]), {
        encoding: 'utf-8',
      });

      await setPorts((ports) => [...ports, 3]);

      await expect(
        readFile(getPortsFilePath(), { encoding: 'utf-8' }),
      ).resolves.toEqual('[1,2,3]');
    });
  });

  describe('when getting a random port', () => {
    it('should return a port', async () => {
      expect(existsSync(getPortsFilePath())).toBe(false);
      await expect(getRandomPort()).resolves.toEqual(1);
    });

    it("should set the port in the file if it doesn't exist", async () => {
      expect(existsSync(getPortsFilePath())).toBe(false);
      await getRandomPort();
      await expect(
        readFile(getPortsFilePath(), { encoding: 'utf-8' }),
      ).resolves.toEqual('[1]');
    });

    it("should max out at 100 attempts per default to find a free port if it can't find one", async () => {
      await mkdir(dirname(getPortsFilePath()), { recursive: true });
      await writeFile(getPortsFilePath(), '[1]', {
        encoding: 'utf-8',
      });

      await expect(getRandomPort()).rejects.toThrow(
        '[getRandomPort] Could not find a free port after 100 retries',
      );
    });

    it("should try to find a free port if it can't find one", async () => {
      await mkdir(dirname(getPortsFilePath()), { recursive: true });
      await writeFile(getPortsFilePath(), '[1]', {
        encoding: 'utf-8',
      });

      await expect(
        getRandomPort({
          maxRetries: 10,
        }),
      ).rejects.toThrow(
        '[getRandomPort] Could not find a free port after 10 retries',
      );
    });

    it('should at least try once to find a free port', async () => {
      await mkdir(dirname(getPortsFilePath()), { recursive: true });
      await writeFile(getPortsFilePath(), '[1]', {
        encoding: 'utf-8',
      });

      await expect(
        getRandomPort({
          maxRetries: 0,
        }),
      ).rejects.toThrow(
        '[getRandomPort] Could not find a free port after 1 retries',
      );
    });
  });
});
