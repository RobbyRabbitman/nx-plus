import { readCachedProjectGraph, workspaceRoot } from '@nx/devkit';
import { access, mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
import { createE2eNxWorkspace, createNxWorkspace } from './nx-workspace.js';

// TODO: mock fs with memfs? node_modules too big for memory?

describe('createNxWorkspace', { timeout: 60_000 }, () => {
  const project =
    readCachedProjectGraph().nodes[process.env.NX_TASK_TARGET_PROJECT!]!;

  // TODO: pass via env? e2e version matrix?
  const nxVersions = ['17', '18', '19'];
  const nxLatest = nxVersions.at(-1)!;

  const cwd = join(
    workspaceRoot,
    'tmp',
    project.data.root,
    'test',
    'createNxWorkspace',
  );

  beforeAll(async () => {
    await rm(cwd, { force: true, recursive: true });
  });

  it('should clear the workspace if specified', async () => {
    const name = 'already-present';

    await mkdir(cwd, { recursive: true });
    await writeFile(join(cwd, name), '');

    await expect(
      createNxWorkspace({
        cwd,
        name,
        version: nxLatest,
        args: '--preset ts',
      }),
    ).rejects.toThrow();

    await expect(
      createNxWorkspace({
        cwd,
        name,
        version: '19',
        args: '--preset ts',
        clear: true,
      }),
    ).resolves.not.toThrow();
  });

  describe('nx compatibility', () => {
    for (const version of nxVersions) {
      describe(version, () => {
        it('should create the workspace', async () => {
          await createNxWorkspace({
            cwd,
            name: `nx${version}`,
            version,
            args: '--preset ts',
          });
        });
      });
    }
  });

  it('create an e2e nx workspace', async () => {
    await expect(
      createE2eNxWorkspace({
        projectName: "this project does not exist in 'nx-plus'",
        name: 'this-should-not-be-created',
        version: nxLatest,
        args: '--preset ts',
      }),
    ).rejects.toThrow();

    const e2eWorkspaceRoot = await createE2eNxWorkspace({
      projectName: project.name,
      name: 'this-should-be-created',
      version: nxLatest,
      args: '--preset ts',
      clear: true,
    });

    await expect(
      access(join(e2eWorkspaceRoot, 'nx.json')),
    ).resolves.not.toThrow();
  });
});
