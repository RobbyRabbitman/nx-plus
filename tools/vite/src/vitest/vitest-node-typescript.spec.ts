import {
  logger,
  type ProjectGraph,
  readCachedProjectGraph,
  workspaceRoot,
} from '@nx/devkit';
import { join } from 'path';
import type { UserConfig } from 'vitest/config';
import { nodeTypescript } from './vitest-node-typescript.js';

vi.mock('@nx/devkit');

describe('[Unit Test] nodeTypescript', () => {
  beforeEach(async () => {
    vi.stubEnv('NX_TASK_TARGET_PROJECT', 'some-project');
    vi.mocked(readCachedProjectGraph).mockReturnValue({
      nodes: {
        'some-project': {
          name: 'some-project',
          type: 'lib',
          data: {
            root: 'some-project',
          },
        },
      },
      dependencies: {},
    } satisfies ProjectGraph);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('should return no config object if the function is not invoked within a nx task', () => {
    vi.stubEnv('NX_TASK_TARGET_PROJECT', '');
    expect(nodeTypescript()).toMatchObject({} satisfies UserConfig);
    expect(logger.verbose).toHaveBeenCalledWith(
      '[nodeTypescript] NX_TASK_TARGET_PROJECT is not set. Are you a nx task?',
    );
  });

  it('should return no config object if the project does not exist in the project graph', () => {
    vi.stubEnv('NX_TASK_TARGET_PROJECT', 'non-existent-project');
    expect(nodeTypescript()).toMatchObject({} satisfies UserConfig);
    expect(logger.verbose).toHaveBeenCalledWith(
      '[nodeTypescript] Project non-existent-project does not exist in the project graph.',
    );
  });

  it("should set the project's root", () => {
    vi.stubEnv('NX_TASK_TARGET_PROJECT', 'some-project');
    expect(nodeTypescript()).toMatchObject({
      root: join(workspaceRoot, 'some-project'),
    } satisfies UserConfig);
  });

  it('should set the cache directory', () => {
    vi.stubEnv('NX_TASK_TARGET_PROJECT', 'some-project');
    expect(nodeTypescript()).toMatchObject({
      cacheDir: join(
        workspaceRoot,
        'node_modules/.cache/vitest',
        'some-project',
      ),
    } satisfies UserConfig);
  });

  it("should set the environment to 'node'", () => {
    vi.stubEnv('NX_TASK_TARGET_PROJECT', 'some-project');
    expect(nodeTypescript()).toMatchObject({
      test: {
        environment: 'node',
      },
    } satisfies UserConfig);
  });
});
