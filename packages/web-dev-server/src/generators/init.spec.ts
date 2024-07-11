import { readNxJson, updateNxJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import initGenerator, { defaultOptions } from './init';

jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  formatFiles: jest.fn(),
}));

const formatFiles = jest.requireMock('@nx/devkit').formatFiles;

describe('nx run @robby-rabbitman/nx-plus-web-dev-server:init', () => {
  const createTree = () =>
    createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

  beforeEach(() => {
    console.warn = jest.fn();
    formatFiles.mockClear();
  });

  describe('should not modify the nx.json when the plugin is already registered in the nx.json', () => {
    it('when provided as string', async () => {
      const tree = createTree();

      updateNxJson(tree, {
        plugins: ['@robby-rabbitman/nx-plus-web-dev-server/plugin'],
      });

      const before = readNxJson(tree);

      await initGenerator(tree, {});

      const after = readNxJson(tree);

      expect(before).toEqual(after);
    });

    it('when provided as object', async () => {
      const tree = createTree();

      updateNxJson(tree, {
        plugins: [
          {
            plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
            options: {
              targetName:
                defaultOptions.targetName +
                'some prefix to ensure its not the default',
            },
          },
        ],
      });

      const before = readNxJson(tree);

      await initGenerator(tree, {});

      const after = readNxJson(tree);

      expect(before).toEqual(after);
    });
  });

  it('should register the plugin in the nx.json when the plugin is not registered in the nx.json', async () => {
    const tree = createTree();

    await initGenerator(tree, {});

    expect(readNxJson(tree).plugins).toContainEqual({
      plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
      options: {
        targetName: 'serve',
      },
    });
  });

  describe('schema', () => {
    it('should set the targetName option to the provided value', async () => {
      const tree = createTree();

      const targetName = 'web-dev-server';

      expect(targetName).not.toBe(defaultOptions.targetName);

      await initGenerator(tree, {
        targetName,
      });

      expect(readNxJson(tree).plugins).toContainEqual({
        plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
        options: {
          targetName,
        },
      });
    });

    it('should not format files when skipFormat is true', async () => {
      const tree = createTree();

      await initGenerator(tree, {
        skipFormat: true,
      });

      expect(formatFiles).not.toHaveBeenCalled();

      await initGenerator(tree, {
        skipFormat: false,
      });

      expect(formatFiles).toHaveBeenCalled();
    });

    it('should not add the plugin to nx.json when skipAddPlugin is true', async () => {
      const tree = createTree();

      await initGenerator(tree, {
        skipAddPlugin: true,
      });

      expect(readNxJson(tree).plugins).toBeUndefined();

      await initGenerator(tree, {
        skipAddPlugin: false,
      });

      expect(readNxJson(tree).plugins).toContainEqual({
        plugin: '@robby-rabbitman/nx-plus-web-dev-server/plugin',
        options: {
          targetName: 'serve',
        },
      });
    });
  });
});