import { readCachedProjectGraph, workspaceRoot } from '@nx/devkit';
import * as nodeUtil from '@robby-rabbitman/nx-plus-libs-node-util';
import { rm } from 'fs/promises';
import { join } from 'path';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  getPorts,
  getRandomPort,
  releaseAllPorts,
  releasePort,
} from './get-random-port.js';

// I guess don't mock the fs, since the actual fs should be tested right (?)
// => therefore we cannot test the default ports file path branches, since this test could be run in parallel with another test that uses the default ports file path

describe('getRandomPort', { timeout: 15_000 }, () => {
  const portsFilePath = join(
    workspaceRoot,
    readCachedProjectGraph().nodes['libs-e2e-util']!.data.root,
    'tmp',
    'test-ports',
    'ports.json',
  );

  beforeAll(async () => {
    await rm(portsFilePath, { force: true, recursive: true });
  });

  afterEach(async () => {
    await releaseAllPorts({ portsFilePath });
  });

  afterAll(async () => {
    expect(await getPorts({ portsFilePath })).toEqual([]);
  });

  it('should return unique ports', async () => {
    const processes = 3;

    const ports = await Promise.all(
      Array.from({ length: processes }, () => getRandomPort({ portsFilePath })),
    );

    expect(new Set(ports).size).toBe(processes);
  });

  it("should throw if a free port can't be found", async () => {
    const port = await getRandomPort({ portsFilePath });

    const getRandomPortSpy = vi
      .spyOn(nodeUtil, 'getRandomPort')
      .mockResolvedValue(port);

    await expect(getRandomPort({ portsFilePath })).rejects.toThrow();

    getRandomPortSpy.mockRestore();
  });

  describe('releasePort', () => {
    it('should remove the port from the ports file', async () => {
      const port = await getRandomPort({ portsFilePath });

      expect(await getPorts({ portsFilePath })).toContain(port);

      await releasePort(port, { portsFilePath });

      expect(await getPorts({ portsFilePath })).not.toContain(port);
    });
  });
});
