/**
 * Represents a custom cache solution for a nx workspace.
 *
 * @see {@link https://nx.dev/recipes/running-tasks/self-hosted-caching}
 */
export interface NxCache {
  /** Retrieves the data for the given hash. */
  get: (hash: string) => Promise<Buffer>;

  /** Whether the cache contains data for the given hash. */
  has: (hash: string) => Promise<boolean>;

  /** Sets the data for the given hash. */
  set: (hash: string, data: Buffer) => Promise<void>;
}
