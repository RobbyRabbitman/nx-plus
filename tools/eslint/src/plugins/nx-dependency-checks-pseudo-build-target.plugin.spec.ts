import { type CreateNodesContextV2, type CreateNodesResult } from '@nx/devkit';
import { type DirectoryJSON, vol } from 'memfs';
import { minimatch } from 'minimatch';
import {
  createNodesV2,
  PSEUDO_BUILD_TARGET_NAME,
} from './nx-dependency-checks-pseudo-build-target.plugin.js';

vi.mock('fs', async () => {
  const memfs = await vi.importActual<typeof import('memfs')>('memfs');

  return memfs.fs;
});

describe('[Unit Test] createNxDependencyChecksPseudoBuildTarget', () => {
  async function inferNxDependencyChecksPseudoBuildTarget(options: {
    directories: DirectoryJSON;
    context?: CreateNodesContextV2;
  }) {
    const [createNodesGlob, createNodesFn] = createNodesV2;

    const { directories } = options;

    const context = {
      nxJsonConfiguration: {},
      workspaceRoot: '',
      ...options.context,
    } satisfies CreateNodesContextV2;

    vol.fromJSON(directories, context.workspaceRoot);

    return createNodesFn(
      Object.keys(directories).filter((file) =>
        minimatch(file, createNodesGlob, { dot: true }),
      ),
      null,
      context,
    );
  }

  afterEach(() => {
    vol.reset();
    vi.resetModules();
  });

  describe('should infer all projects', () => {
    describe('package.json', () => {
      it('should be inferred', async () => {
        const nodes = await inferNxDependencyChecksPseudoBuildTarget({
          directories: {
            'package.json': '',
            'project-1/package.json': '',
            'nested/project-2/package.json': '',
          },
        });

        expect(nodes).toEqual([
          ['package.json', expect.anything()],
          ['project-1/package.json', expect.anything()],
          ['nested/project-2/package.json', expect.anything()],
        ]);
      });

      it('should add a target in the project root', async () => {
        /**
         * The package.json is in the project root => add the target in its
         * directory.
         */

        const nodes = await inferNxDependencyChecksPseudoBuildTarget({
          directories: {
            'project-1/package.json': '',
          },
        });

        expect(nodes).toEqual([
          [
            'project-1/package.json',
            {
              projects: {
                'project-1': expect.objectContaining({
                  targets: expect.objectContaining({
                    [PSEUDO_BUILD_TARGET_NAME]: expect.anything(),
                  }),
                }),
              },
            } satisfies CreateNodesResult,
          ],
        ]);
      });
    });
  });

  describe('the created nodes', () => {
    describe('should include a pseudo build target', () => {
      it("which should be named 'eslint-nx-dependency-checks-pseudo-build'", async () => {
        const nodes = await inferNxDependencyChecksPseudoBuildTarget({
          directories: {
            'project-1/package.json': '',
          },
        });

        expect(nodes).toEqual([
          [
            'project-1/package.json',
            {
              projects: {
                'project-1': expect.objectContaining({
                  targets: expect.objectContaining({
                    'eslint-nx-dependency-checks-pseudo-build':
                      expect.anything(),
                  }),
                }),
              },
            } satisfies CreateNodesResult,
          ],
        ]);
      });

      it('which should not be called', async () => {
        const nodes = await inferNxDependencyChecksPseudoBuildTarget({
          directories: {
            'project-1/package.json': '',
          },
        });

        expect(nodes).toEqual([
          [
            'project-1/package.json',
            {
              projects: {
                'project-1': expect.objectContaining({
                  targets: expect.objectContaining({
                    [PSEUDO_BUILD_TARGET_NAME]: {
                      command:
                        "echo 'It seems like you called me - you should not. I am just a workaround for https://github.com/nrwl/nx/issues/9748' && exit 1",
                    },
                  }),
                }),
              },
            } satisfies CreateNodesResult,
          ],
        ]);
      });
    });
  });
});
