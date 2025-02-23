import { readCachedProjectGraph } from '@nx/devkit';
import { describe } from 'vitest';
import { readNxTask } from './read-task';

vi.mock('@nx/devkit');

describe('[Unit Test] readNxTask', () => {
  /** Stubs the environment variables that are read by `readNxTask()`. */
  function stubEnv() {
    vi.stubEnv('NX_TASK_TARGET_PROJECT', 'some-project');
    vi.stubEnv('NX_TASK_TARGET_TARGET', 'some-target');
    vi.stubEnv('NX_TASK_TARGET_CONFIGURATION', 'some-configuration');
    vi.stubEnv('NX_DRY_RUN', 'true');
    vi.stubEnv('NX_INTERACTIVE', 'true');
  }

  /**
   * Stubs the project graph that is read by `readNxTask()`.
   *
   * - Includes a project node for `'some-project'` => aligns with `stubEnv()`
   */
  function stubProjectGraph() {
    vi.mocked(readCachedProjectGraph).mockReturnValue({
      dependencies: {},
      nodes: {
        'some-project': {
          data: {
            root: 'some/project',
          },
          name: 'some-project',
          type: 'app',
        },
      },
    });
  }

  beforeEach(() => {
    stubEnv();
    stubProjectGraph();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should return the current nx task's information", () => {
    expect(readNxTask()).toEqual({
      configuration: 'some-configuration',
      dryRun: true,
      isInteractive: true,
      project: {
        root: 'some/project',
      },
      projectName: 'some-project',
      target: 'some-target',
    });
  });

  describe('when the current process is not a nx task', () => {
    it('should return undefined when it should not be asserted', () => {
      vi.stubEnv('NX_TASK_TARGET_PROJECT', undefined);

      expect(
        readNxTask({
          assertNxTask: false,
        }),
      ).toBeUndefined();
    });

    it('should throw an error when it should be asserted', () => {
      vi.stubEnv('NX_TASK_TARGET_PROJECT', undefined);

      expect(() => readNxTask()).toThrowError(
        "[readNxTask] Could not find 'NX_TASK_TARGET_PROJECT' in the environment variables - this seems not to be a nx task.",
      );
    });
  });

  it('should throw an error if the project is not found in the project graph', () => {
    /**
     * This _should_ not really happen - this may happen if the project graph is
     * corrupt or nx itself has a bug.
     */

    vi.stubEnv('NX_TASK_TARGET_PROJECT', 'non-existing-project');

    expect(() => readNxTask()).toThrowError(
      "[readNxTask] Could not find the project 'non-existing-project' in this nx workspace. Try run 'nx reset' to reset the project graph.",
    );
  });
});
