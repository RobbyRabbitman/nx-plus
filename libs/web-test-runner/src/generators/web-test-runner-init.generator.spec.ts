import { formatFiles, readNxJson, updateNxJson } from '@nx/devkit';
import { webTestRunnerInitGenerator } from './web-test-runner-init.generator.js';

vi.mock('@nx/devkit');

describe('[Unit Test] generate run @robby-rabbitman/nx-plus-web-test-runner:init', () => {
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
          '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
        ],
      });
      await webTestRunnerInitGenerator(MOCK_TREE, {});
      expect(updateNxJson).not.toHaveBeenCalled();
    });

    it('when the plugin is registered as an object', async () => {
      vi.mocked(readNxJson).mockReturnValueOnce({
        plugins: [
          {
            plugin:
              '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
            options: {},
          },
        ],
      });
      await webTestRunnerInitGenerator(MOCK_TREE, {});
      expect(updateNxJson).not.toHaveBeenCalled();
    });
  });

  describe('should add the plugin to the `nx.json`', () => {
    it('when the plugin is not registered', async () => {
      await webTestRunnerInitGenerator(MOCK_TREE, {});
      expect(updateNxJson).toHaveBeenCalledWith(
        MOCK_TREE,
        expect.objectContaining({
          plugins: [
            expect.objectContaining({
              plugin:
                '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
            }),
          ],
        }),
      );
    });
  });

  it("should create the `nx.json` file when it doesn't exist", async () => {
    vi.mocked(readNxJson).mockReturnValueOnce(null);

    await webTestRunnerInitGenerator(MOCK_TREE, {});

    expect(updateNxJson).toHaveBeenCalledWith(
      MOCK_TREE,
      expect.objectContaining({
        plugins: [
          expect.objectContaining({
            plugin:
              '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
          }),
        ],
      }),
    );
  });

  describe('schema', () => {
    describe('testTargetName', () => {
      it('should use the provided value', async () => {
        const testTargetName = 'web-test-runner';

        await webTestRunnerInitGenerator(MOCK_TREE, {
          testTargetName,
        });

        expect(updateNxJson).toHaveBeenCalledWith(
          MOCK_TREE,
          expect.objectContaining({
            plugins: [
              expect.objectContaining({
                plugin:
                  '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
                options: {
                  testTargetName,
                },
              }),
            ],
          }),
        );
      });

      it('should fall back to `test` when the provided value is an empty string', async () => {
        const testTargetName = '';

        await webTestRunnerInitGenerator(MOCK_TREE, {
          testTargetName,
        });

        expect(updateNxJson).toHaveBeenCalledWith(
          MOCK_TREE,
          expect.objectContaining({
            plugins: [
              expect.objectContaining({
                plugin:
                  '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
                options: {
                  testTargetName: 'test',
                },
              }),
            ],
          }),
        );
      });

      it('should fall back to `test` when the value is not provided', async () => {
        await webTestRunnerInitGenerator(MOCK_TREE, {});

        expect(updateNxJson).toHaveBeenCalledWith(
          MOCK_TREE,
          expect.objectContaining({
            plugins: [
              expect.objectContaining({
                plugin:
                  '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
                options: {
                  testTargetName: 'test',
                },
              }),
            ],
          }),
        );
      });
    });

    describe('skipFormatFiles', () => {
      it('should format when the value is not provided', async () => {
        await webTestRunnerInitGenerator(MOCK_TREE, {});

        expect(formatFiles).toHaveBeenCalled();
      });

      it('should format when the provided value is `false`', async () => {
        await webTestRunnerInitGenerator(MOCK_TREE, { skipFormat: false });

        expect(formatFiles).toHaveBeenCalled();
      });

      it('should not format when the provided value is `true`', async () => {
        await webTestRunnerInitGenerator(MOCK_TREE, { skipFormat: true });

        expect(formatFiles).not.toHaveBeenCalled();
      });
    });

    describe('skipAddPlugin', () => {
      it('should add the plugin to `nx.json` when the value is not provided', async () => {
        await webTestRunnerInitGenerator(MOCK_TREE, {});

        expect(updateNxJson).toHaveBeenCalledWith(
          MOCK_TREE,
          expect.objectContaining({
            plugins: [
              expect.objectContaining({
                plugin:
                  '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
              }),
            ],
          }),
        );
      });

      it('should add the plugin to `nx.json` when the provided value is `false`', async () => {
        await webTestRunnerInitGenerator(MOCK_TREE, {
          skipAddPlugin: false,
        });

        expect(updateNxJson).toHaveBeenCalledWith(
          MOCK_TREE,
          expect.objectContaining({
            plugins: [
              expect.objectContaining({
                plugin:
                  '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner',
              }),
            ],
          }),
        );
      });

      it('should not add the plugin to `nx.json` when the provided value is `true`', async () => {
        await webTestRunnerInitGenerator(MOCK_TREE, {
          skipAddPlugin: true,
        });

        expect(updateNxJson).not.toHaveBeenCalled();
      });
    });
  });
});
