import { vol } from 'memfs';
import { afterEach, describe, vi } from 'vitest';

vi.mock('fs', async (originalImport) => {
  const memfs = await originalImport<typeof import('memfs')>();
  return memfs.fs;
});

vi.mock('fs/promises', async (originalImport) => {
  const memfs = await originalImport<typeof import('memfs')>();
  return memfs.fs.promises;
});

describe('e2e version matrix', () => {
  afterEach(() => {
    vol.reset();
  });
});
