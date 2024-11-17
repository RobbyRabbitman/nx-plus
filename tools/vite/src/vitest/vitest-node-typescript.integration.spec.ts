import { workspaceRoot } from '@nx/devkit';
import { join } from 'path';
import { UserConfig } from 'vitest/config';
import { nodeTypescript } from './vitest-node-typescript.js';

describe('[Integration Test] nodeTypescript', () => {
  it('should point to the project root', () => {
    expect(nodeTypescript()).toMatchObject({
      root: join(workspaceRoot, 'tools/vite'),
    } satisfies UserConfig);
  });

  it('should have a cache dir', () => {
    expect(nodeTypescript()).toMatchObject({
      cacheDir: join(workspaceRoot, 'node_modules/.cache/vitest', 'tools/vite'),
    } satisfies UserConfig);
  });

  it('should run in node', () => {
    expect(nodeTypescript()).toMatchObject({
      test: {
        environment: 'node',
      },
    } satisfies UserConfig);
  });

  it('should respect ts paths', async () => {
     
    const nxPlusViteModule = await import(
      '@robby-rabbitman/nx-plus-tools-vite'
    );

    expect(nxPlusViteModule).toBeTruthy();
  });
});
