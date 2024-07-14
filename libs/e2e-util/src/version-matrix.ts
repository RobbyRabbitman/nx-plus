export interface VersionMatrixConfig {
  /** The package name e.g. `my-lib`. */
  name: string;
  /** The version of the package e.g. `local`. */
  version: string;
  /**
   * The peer dependencies of the package e.g.
   *
   * ```json
   * {
   *   "nx": ["^17", "^18", "^19"],
   *   "@web/dev-server": ["^0.4.6"]
   * }
   * ```
   */
  peerDependencies: {
    [peerDependency: string]: string[];
  };
}

export interface VersionMatrixItem {
  /** The package name e.g. `my-lib`. */
  name: string;
  /** The version of the package e.g. `local`. */
  version: string;
  /**
   * A permutation of the peer dependencies of the e2e package e.g.
   *
   * ```json
   * {
   *   "nx": "^17",
   *   "@web/dev-server": "^0.4.6"
   * }
   * ```
   *
   * @see {@link VersionMatrixConfig}
   */
  peerDependencies: {
    [peerDependency: string]: string;
  };
}

/** @returns The permutations of the peer dependencies of a package. */
export function createVersionMatrix(config: VersionMatrixConfig) {
  const { name, version, peerDependencies } = config;

  const peerDependencyPermutations =
    createPeerDependencyPermutations(peerDependencies);

  const versionMatrix = peerDependencyPermutations.map(
    (peerDependencyPermutation) =>
      ({
        name,
        version,
        peerDependencies: peerDependencyPermutation,
      }) satisfies VersionMatrixItem,
  );

  if (process.env['NX_VERBOSE_LOGGING'] === 'true') {
    console.log(versionMatrix);
  }

  return versionMatrix;
}

// TODO: verify copa pasta from chat gpt :D
function createPeerDependencyPermutations(
  peerDependencies: Record<string, string[]>,
): Record<string, string>[] {
  const peerDependencyNames = Object.keys(peerDependencies);
  const results: Record<string, string>[] = [];

  function helper(index: number, current: Record<string, string>) {
    if (index === peerDependencyNames.length) {
      results.push({ ...current });
      return;
    }

    const dep = peerDependencyNames[index];
    for (const version of peerDependencies[dep]) {
      current[dep] = version;
      helper(index + 1, current);
      delete current[dep]; // Clean up for the next iteration
    }
  }

  helper(0, {});
  return results;
}
