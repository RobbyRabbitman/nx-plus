import { readCachedProjectGraph, type ProjectGraph } from '@nx/devkit';
import { spawnSync, type SpawnSyncReturns } from 'child_process';
import { rm } from 'fs/promises';
import { createE2eNxWorkspace } from './nx-workspace.js';

vi.mock('@nx/devkit', () => ({
  logger: {
    verbose: vi.fn(),
  },
  workspaceRoot: 'some-workspace',
  readCachedProjectGraph: vi.fn(),
}));

vi.mock('fs/promises');

vi.mock('child_process');

describe('[Unit Test] createE2eNxWorkspace', () => {
  beforeEach(() => {
    vi.stubEnv('NX_TASK_TARGET_PROJECT', 'some-project');

    vi.mocked(readCachedProjectGraph).mockReturnValue({
      dependencies: {},
      nodes: {
        'some-project': {
          name: 'some-project',
          type: 'lib',
          data: {
            root: 'some-project',
          },
        },
      },
    } satisfies ProjectGraph);

    vi.mocked(spawnSync).mockReturnValue({
      pid: 123,
      status: 0,
      output: [],
      signal: null,
      stderr: Buffer.from(''),
      stdout: Buffer.from(''),
    } satisfies SpawnSyncReturns<Buffer>);
  });

  it('should be inkoved as a nx task', async () => {
    vi.stubEnv('NX_TASK_TARGET_PROJECT', '');

    await expect(createE2eNxWorkspace()).rejects.toThrowError(
      '[createE2eNxWorkspace] Missing required environment variable NX_TASK_TARGET_PROJECT - are you a nx task?',
    );
  });

  it('should be invoked by a nx project', async () => {
    vi.stubEnv('NX_TASK_TARGET_PROJECT', 'non-existing-project');

    await expect(createE2eNxWorkspace()).rejects.toThrowError(
      '[createE2eNxWorkspace] Could not find project config for project non-existing-project',
    );
  });

  it('should clear any existing e2e-nx-workspace', async () => {
    await createE2eNxWorkspace({
      name: 'some-e2e-workspace',
    });

    expect(rm).toHaveBeenCalledWith(
      'some-workspace/some-project/e2e-nx-workspaces/some-e2e-workspace',
      { recursive: true, force: true },
    );
  });

  describe('should create a new e2e-nx-workspace', () => {
    it('with no nx cloud, no git repo, no user interaction with the nx version of this workspace', async () => {
      await createE2eNxWorkspace({
        name: 'some-e2e-workspace',
      });

      expect(spawnSync).toHaveBeenCalledWith(
        'pnpx',
        [
          /**
           * This test makes sure this workspace supports a single major nx
           * version for all its packages.
           *
           * When upgrading to a new major version of nx, we need to update the
           * version in this test.
           */
          expect.stringMatching(/^create-nx-workspace@20/),
          '--name=some-e2e-workspace',
          '--skipGit=true',
          '--nxCloud=skip',
          '--interactive=false',
        ],
        {
          cwd: 'some-workspace/some-project/e2e-nx-workspaces',
        },
      );
    });

    it('with additional cli args', async () => {
      await createE2eNxWorkspace({
        args: {
          preset: 'angular',
        },
      });

      expect(spawnSync).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining(['--preset=angular']),
        expect.anything(),
      );
    });

    it("and return the workspace's root of the created nx workspace", async () => {
      const workspaceRoot = await createE2eNxWorkspace({
        name: 'some-e2e-workspace',
      });

      expect(workspaceRoot).toBe(
        'some-workspace/some-project/e2e-nx-workspaces/some-e2e-workspace',
      );
    });
  });

  it('should throw an error when creating the nx workspace fails', async () => {
    vi.mocked(spawnSync).mockReturnValueOnce({
      pid: 123,
      status: 1,
      output: [],
      signal: null,
      stderr: Buffer.from('some error message on stderr'),
      stdout: Buffer.from(''),
      error: new Error('some error'),
    } satisfies SpawnSyncReturns<Buffer>);

    await expect(
      createE2eNxWorkspace({ name: 'some-e2e-workspace' }),
    ).rejects.toThrowError(
      '[createNxWorkspace] Failed to create nx workspace in some-workspace/some-project/e2e-nx-workspaces/some-e2e-workspace',
    );
  });
});
