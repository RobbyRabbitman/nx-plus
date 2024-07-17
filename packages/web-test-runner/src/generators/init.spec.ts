import * as devkit from '@nx/devkit';
import { readNxJson, updateNxJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Mock } from 'vitest';
import { initGenerator, WebTestRunnerInitGeneratorSchema } from './init';

vi.mock('@nx/devkit', async () => {
  const module = await vi.importActual('@nx/devkit');
  return {
    ...module,
    formatFiles: vi.fn(),
  };
});

describe('nx run @robby-rabbitman/nx-plus-web-test-runner:init', () => {
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
        plugins: ['@robby-rabbitman/nx-plus-web-test-runner/plugin'],
      });

      const before = readNxJson(workspace);

      await initGenerator(workspace, { testTargetName: 'test' });

      const after = readNxJson(workspace);

      expect(after).toEqual(before);
    });

    it('when provided as an object', async () => {
      const workspace = createWorkspace();

      const testTargetName = 'I am already registered :D';

      updateNxJson(workspace, {
        plugins: [
          {
            plugin: '@robby-rabbitman/nx-plus-web-test-runner/plugin',
            options: {
              testTargetName,
            } satisfies WebTestRunnerInitGeneratorSchema,
          },
        ],
      });

      const before = readNxJson(workspace);

      await initGenerator(workspace, { testTargetName: 'test' });

      const after = readNxJson(workspace);

      expect(after).toEqual(before);
    });
  });

  it('should register the plugin in the `nx.json` when the plugin is not registered in the `nx.json`', async () => {
    const workspace = createWorkspace();

    await initGenerator(workspace, {});

    expect(readNxJson(workspace).plugins).toContainEqual(
      expect.objectContaining({
        plugin: '@robby-rabbitman/nx-plus-web-test-runner/plugin',
      }),
    );
  });

  describe('schema', () => {
    describe('testTargetName', () => {
      it('should use the provided value', async () => {
        const workspace = createWorkspace();

        const testTargetName = 'web-test-runner';

        await initGenerator(workspace, {
          testTargetName,
        });

        expect(readNxJson(workspace).plugins).toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-test-runner/plugin',
            options: {
              testTargetName,
            } satisfies WebTestRunnerInitGeneratorSchema,
          }),
        );
      });

      it('should fall back to `test` when the provided value is an empty string', async () => {
        const workspace = createWorkspace();

        const testTargetName = '';

        await initGenerator(workspace, {
          testTargetName,
        });

        expect(readNxJson(workspace).plugins).toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-test-runner/plugin',
            options: {
              testTargetName: 'test',
            } satisfies WebTestRunnerInitGeneratorSchema,
          }),
        );
      });

      it('should fall back to `test` when the value is not provided', async () => {
        const workspace = createWorkspace();

        await initGenerator(workspace, {});

        expect(readNxJson(workspace).plugins).toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-test-runner/plugin',
            options: {
              testTargetName: 'test',
            } satisfies WebTestRunnerInitGeneratorSchema,
          }),
        );
      });
    });

    describe('skipFormatFiles', () => {
      it('should format when the value is not provided', async () => {
        const workspace = createWorkspace();

        expect(formatFiles).not.toHaveBeenCalled();

        await initGenerator(workspace, {});

        expect(formatFiles).toHaveBeenCalled();
      });

      it('should format when the provided value is `false`', async () => {
        const workspace = createWorkspace();

        expect(formatFiles).not.toHaveBeenCalled();

        await initGenerator(workspace, { skipFormat: false });

        expect(formatFiles).toHaveBeenCalled();
      });

      it('should not format when the provided value is `true`', async () => {
        const workspace = createWorkspace();

        await initGenerator(workspace, { skipFormat: true });

        expect(formatFiles).not.toHaveBeenCalled();
      });
    });

    describe('skipAddPlugin', () => {
      it('should add the plugin to `nx.json` when the value is not provided', async () => {
        const workspace = createWorkspace();

        await initGenerator(workspace, {});

        expect(readNxJson(workspace).plugins).toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-test-runner/plugin',
          }),
        );
      });

      it('should add the plugin to `nx.json` when the provided value is `false`', async () => {
        const workspace = createWorkspace();

        await initGenerator(workspace, {
          skipAddPlugin: false,
        });

        expect(readNxJson(workspace).plugins).toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-test-runner/plugin',
          }),
        );
      });

      it('should not add the plugin to `nx.json` when the provided value is `true`', async () => {
        const workspace = createWorkspace();

        expect(readNxJson(workspace).plugins ?? []).not.toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-test-runner/plugin',
          }),
        );

        await initGenerator(workspace, {
          skipAddPlugin: true,
        });

        expect(readNxJson(workspace).plugins ?? []).not.toContainEqual(
          expect.objectContaining({
            plugin: '@robby-rabbitman/nx-plus-web-test-runner/plugin',
          }),
        );
      });
    });
  });
});
