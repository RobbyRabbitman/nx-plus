import type { NxCache } from './nx-cache';

/**
 * A stub implementation of the NxCache interface for testing purposes. It
 * stores the data in memory.
 */
export class NxCacheStub implements NxCache {
  protected readonly data = new Map<string, Buffer>();

  async get(hash: string) {
    return this.data.get(hash) ?? Buffer.from('');
  }

  async has(hash: string) {
    return this.data.has(hash);
  }

  async set(hash: string, data: Buffer) {
    this.data.set(hash, data);
  }

  clear() {
    this.data.clear();
  }
}

describe.todo('[Unit Test] NxCache');
