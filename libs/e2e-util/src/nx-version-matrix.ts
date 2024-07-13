export interface E2eProjectWithNx {
  name: string;
  peerDependencies: {
    nx: string[];
    [otherPeerDependency: string]: string[];
  };
}

interface E2eProjectWithNxPermutation {
  name: string;
  peerDependencies: {
    nx: string;
    [otherPeerDependency: string]: string;
  };
}

export function createVersionMatrix(e2eProject: E2eProjectWithNx) {
  const {
    name: e2eProjectName,
    peerDependencies: { nx, ...peerDependencies },
  } = e2eProject;

  const peerDependencyPermutations =
    createPeerDependencyPermutations(peerDependencies);

  const e2eProjectWithNxPermutations: E2eProjectWithNxPermutation[] =
    nx.flatMap((nxVersion) =>
      peerDependencyPermutations.map((peerDependencyPermutation) => ({
        name: e2eProjectName,
        peerDependencies: { ...peerDependencyPermutation, nx: nxVersion },
      })),
    );

  if (process.env['NX_VERBOSE_LOGGING'] === 'true') {
    console.log(e2eProjectWithNxPermutations);
  }

  return e2eProjectWithNxPermutations;
}

// TODO verify copa pasta from chat gpt :D
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
