import type { NxCache } from './nx-cache.js';

/**
 * A memory-based implementation of the `NxCache` interface, e.g. for testing
 * scenarios.
 */
export class NxCacheInMemory implements NxCache {
  protected readonly data = new Map<string, Buffer>();

  async get(hash: string) {
    const data = this.data.get(hash);

    if (!data) {
      throw new Error(`Hash "${hash}" does not exist.`);
    }

    return data;
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
