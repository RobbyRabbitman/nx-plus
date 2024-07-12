export interface VersionMatrix {
  nxVersions: string[];
  e2eProject: string;
  peerDependencies: Record<string, string[]>;
}

export interface VersionMatrixItem {
  nxVersion: string;
  e2eProject: string;
  peerDependencies: Record<string, string>;
}

export function createVersionPermutations(
  versionMatrix: VersionMatrix,
): VersionMatrixItem[] {
  const { nxVersions, e2eProject, peerDependencies } = versionMatrix;

  const peerDependencyPermutations =
    generatePeerDependencyPermutations(peerDependencies);

  const versionMatrixItems: VersionMatrixItem[] = nxVersions.flatMap(
    (nxVersion) =>
      peerDependencyPermutations.map((peerDependencyPermutation) => ({
        nxVersion,
        e2eProject,
        peerDependencies: { ...peerDependencyPermutation },
      })),
  );

  if (process.env['NX_VERBOSE_LOGGING'] === 'true') {
    console.log(versionMatrixItems);
  }

  return versionMatrixItems;
}

function generatePeerDependencyPermutations(
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
