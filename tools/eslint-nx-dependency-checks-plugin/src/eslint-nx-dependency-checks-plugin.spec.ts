import { type CreateNodesContextV2, type CreateNodesResult } from '@nx/devkit';
import { type DirectoryJSON, vol } from 'memfs';
import { minimatch } from 'minimatch';
import { createNodesV2 } from './eslint-nx-dependency-checks-plugin.js';

vi.mock('fs', async () => {
  const memfs = await vi.importActual<typeof import('memfs')>('memfs');

  return memfs.fs;
});

describe('[Unit Test] infer pseudo build target for eslint @nx/dependency-checks', () => {
  const inferNxDependencyChecksPseudoBuildTarget = async (options: {
    directories: DirectoryJSON;
    context?: CreateNodesContextV2;
  }) => {
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
      undefined,
      context,
    );
  };

  afterEach(() => {
    vol.reset();
    vi.resetModules();
  });

  it("should infer 'package.json' files", async () => {
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

  it("should add a target in the directory that the 'package.json' file is in", async () => {
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
                'eslint-nx-dependency-checks-pseudo-build': expect.anything(),
              }),
            }),
          },
        } satisfies CreateNodesResult,
      ],
    ]);
  });

  it('should add a target with a command that always fails', async () => {
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
                'eslint-nx-dependency-checks-pseudo-build': {
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
