import { formatFiles, readNxJson, updateNxJson } from '@nx/devkit';
import { webDevServerInitGenerator } from './web-dev-server-init.generator.js';

vi.mock('@nx/devkit');

describe('[Unit Test] nx run @robby-rabbitman/nx-plus-web-dev-server:init', () => {
  const MOCK_TREE = Symbol('MOCK_TREE');

  beforeEach(() => {
    vi.mocked(readNxJson).mockReturnValue({
      plugins: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('should not modify the `nx.json`', () => {
    it('when the plugin is registered as a string', async () => {
      vi.mocked(readNxJson).mockReturnValueOnce({
        plugins: [
          '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server',
        ],
      });
      await webDevServerInitGenerator(MOCK_TREE, {});
      expect(updateNxJson).not.toHaveBeenCalled();
    });

    it('when the plugin is registered as an object', async () => {
      vi.mocked(readNxJson).mockReturnValueOnce({
        plugins: [
          {
            plugin:
              '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server',
            options: {},
          },
        ],
      });
      await webDevServerInitGenerator(MOCK_TREE, {});
      expect(updateNxJson).not.toHaveBeenCalled();
    });
  });

  describe('should add the plugin to the `nx.json`', () => {
    it('when the plugin is not registered', async () => {
      await webDevServerInitGenerator(MOCK_TREE, {});
      expect(updateNxJson).toHaveBeenCalledWith(
        MOCK_TREE,
        expect.objectContaining({
          plugins: [
            expect.objectContaining({
              plugin:
                '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server',
            }),
          ],
        }),
      );
    });
  });

  describe('schema', () => {
    describe('serveTargetName', () => {
      it('should use the provided value', async () => {
        const serveTargetName = 'web-dev-server';

        await webDevServerInitGenerator(MOCK_TREE, {
          serveTargetName,
        });

        expect(updateNxJson).toHaveBeenCalledWith(
          MOCK_TREE,
          expect.objectContaining({
            plugins: [
              expect.objectContaining({
                plugin:
                  '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server',
                options: {
                  serveTargetName,
                },
              }),
            ],
          }),
        );
      });

      it('should fall back to `serve` when the provided value is an empty string', async () => {
        const serveTargetName = '';

        await webDevServerInitGenerator(MOCK_TREE, {
          serveTargetName,
        });

        expect(updateNxJson).toHaveBeenCalledWith(
          MOCK_TREE,
          expect.objectContaining({
            plugins: [
              expect.objectContaining({
                plugin:
                  '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server',
                options: {
                  serveTargetName: 'serve',
                },
              }),
            ],
          }),
        );
      });

      it('should fall back to `serve` when the value is not provided', async () => {
        await webDevServerInitGenerator(MOCK_TREE, {});

        expect(updateNxJson).toHaveBeenCalledWith(
          MOCK_TREE,
          expect.objectContaining({
            plugins: [
              expect.objectContaining({
                plugin:
                  '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server',
                options: {
                  serveTargetName: 'serve',
                },
              }),
            ],
          }),
        );
      });
    });

    describe('skipFormatFiles', () => {
      it('should format when the value is not provided', async () => {
        await webDevServerInitGenerator(MOCK_TREE, {});

        expect(formatFiles).toHaveBeenCalled();
      });

      it('should format when the provided value is `false`', async () => {
        await webDevServerInitGenerator(MOCK_TREE, { skipFormat: false });

        expect(formatFiles).toHaveBeenCalled();
      });

      it('should not format when the provided value is `true`', async () => {
        await webDevServerInitGenerator(MOCK_TREE, { skipFormat: true });

        expect(formatFiles).not.toHaveBeenCalled();
      });
    });

    describe('skipAddPlugin', () => {
      it('should add the plugin to `nx.json` when the value is not provided', async () => {
        await webDevServerInitGenerator(MOCK_TREE, {});

        expect(updateNxJson).toHaveBeenCalledWith(
          MOCK_TREE,
          expect.objectContaining({
            plugins: [
              expect.objectContaining({
                plugin:
                  '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server',
              }),
            ],
          }),
        );
      });

      it('should add the plugin to `nx.json` when the provided value is `false`', async () => {
        await webDevServerInitGenerator(MOCK_TREE, {
          skipAddPlugin: false,
        });

        expect(updateNxJson).toHaveBeenCalledWith(
          MOCK_TREE,
          expect.objectContaining({
            plugins: [
              expect.objectContaining({
                plugin:
                  '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server',
              }),
            ],
          }),
        );
      });

      it('should not add the plugin to `nx.json` when the provided value is `true`', async () => {
        await webDevServerInitGenerator(MOCK_TREE, {
          skipAddPlugin: true,
        });

        expect(updateNxJson).not.toHaveBeenCalled();
      });
    });
  });
});
