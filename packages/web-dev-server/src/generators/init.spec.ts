import * as devkit from '@nx/devkit';
import { readNxJson, updateNxJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Mock } from 'vitest';
import { initGenerator, WebDevServerInitGeneratorSchema } from './init';

vi.mock('@nx/devkit', async () => {
  const module = await vi.importActual('@nx/devkit');
  return {
    ...module,
    formatFiles: vi.fn(),
  };
});

describe('nx run @robby-rabbitman/nx-plus-web-dev-server:init', () => {
  const formatFiles = devkit.formatFiles as Mock;
  const createWorkspace = () =>
    createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

  beforeEach(() => {
    console.warn = vi.fn();
    formatFiles.mockClear();
  });

  describe('should not modify the `nx.json` when the plugin is already registered in the `nx.json`', () => {
    it('when provided as an string', async () => {
      const workspace = createWorkspace();

      updateNxJson(workspace, {
        plugins: ['@robby-rabbitman/nx-plus-web-dev-server/plugin'],
      });

      const before = readNxJson(workspace);

      await initGenerator(workspace, { serveTargetName: 'serve' });

      const after = readNxJson(workspace);

      expect(after).toEqual(before);
    });

    it('when provided as an object', async () => {
      const workspace = createWorkspace();

      const serveTargetName = 'I am already registered :D';

      updateNxJson(workspace, {
        plugins: [
          {
            plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
            options: {
              serveTargetName,
            } satisfies WebDevServerInitGeneratorSchema,
          },
        ],
      });

      const before = readNxJson(workspace);

      await initGenerator(workspace, { serveTargetName: 'serve' });

      const after = readNxJson(workspace);

      expect(after).toEqual(before);
    });
  });

  it('should register the plugin in the `nx.json` when the plugin is not registered in the `nx.json`', async () => {
    const workspace = createWorkspace();

    await initGenerator(workspace, {});

    expect(readNxJson(workspace).plugins).toContainEqual(
      expect.objectContaining({
        plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
      }),
    );
  });

  describe('schema', () => {
    describe('serveTargetName', () => {
      it('should use the provided value', async () => {
        const workspace = createWorkspace();

        const serveTargetName = 'web-dev-server';

        await initGenerator(workspace, {
          serveTargetName,
        });

        expect(readNxJson(workspace).plugins).toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
            options: {
              serveTargetName,
            } satisfies WebDevServerInitGeneratorSchema,
          }),
        );
      });

      it('should fall back to `serve` when the provided value is an empty string', async () => {
        const workspace = createWorkspace();

        const serveTargetName = '';

        await initGenerator(workspace, {
          serveTargetName,
        });

        expect(readNxJson(workspace).plugins).toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
            options: {
              serveTargetName: 'serve',
            } satisfies WebDevServerInitGeneratorSchema,
          }),
        );
      });

      it('should fall back to `serve` when the value is not provided', async () => {
        const workspace = createWorkspace();

        await initGenerator(workspace, {});

        expect(readNxJson(workspace).plugins).toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
            options: {
              serveTargetName: 'serve',
            } satisfies WebDevServerInitGeneratorSchema,
          }),
        );
      });
    });

    describe('skipFormatFiles', () => {
      it('should format when the value is not provided', async () => {
        const tree = createWorkspace();

        expect(formatFiles).not.toHaveBeenCalled();

        await initGenerator(tree, {});

        expect(formatFiles).toHaveBeenCalled();
      });

      it('should format when the provided value is `false`', async () => {
        const tree = createWorkspace();

        expect(formatFiles).not.toHaveBeenCalled();

        await initGenerator(tree, { skipFormat: false });

        expect(formatFiles).toHaveBeenCalled();
      });

      it('should not format when the provided value is `true`', async () => {
        const tree = createWorkspace();

        await initGenerator(tree, { skipFormat: true });

        expect(formatFiles).not.toHaveBeenCalled();
      });
    });

    describe('skipAddPlugin', () => {
      it('should add the plugin to `nx.json` when the value is not provided', async () => {
        const tree = createWorkspace();

        await initGenerator(tree, {});

        expect(readNxJson(tree).plugins).toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
          }),
        );
      });

      it('should add the plugin to `nx.json` when the provided value is `false`', async () => {
        const tree = createWorkspace();

        await initGenerator(tree, {
          skipAddPlugin: false,
        });

        expect(readNxJson(tree).plugins).toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
          }),
        );
      });

      it('should not add the plugin to `nx.json` when the provided value is `true`', async () => {
        const tree = createWorkspace();

        expect(readNxJson(tree).plugins ?? []).not.toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
          }),
        );

        await initGenerator(tree, {
          skipAddPlugin: true,
        });

        expect(readNxJson(tree).plugins ?? []).not.toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
          }),
        );
      });
    });
  });
});
