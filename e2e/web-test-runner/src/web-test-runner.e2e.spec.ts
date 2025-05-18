import {
  getPackageManagerCommand,
  readCachedProjectGraph,
  workspaceRoot,
  type TargetConfiguration,
} from '@nx/devkit';
import webTestRunnerExampleProjectPackageJson from '@robby-rabbitman/nx-plus-examples-web-test-runner/package.json';
import { execSync } from 'child_process';

describe('[e2e Test] Web Test Runner', () => {
  const webTestRunnerExampleProjectName =
    webTestRunnerExampleProjectPackageJson.nx.name;

  const webTestRunnerExampleProject =
    readCachedProjectGraph().nodes[webTestRunnerExampleProjectName]!.data;

  const webTestRunnerTargetName = 'test-web-test-runner';

  function invokeWebTestRunnerOfExampleProject() {
    return execSync(
      `${getPackageManagerCommand().exec} nx run ${webTestRunnerExampleProjectName}:${webTestRunnerTargetName}:ci`,
      {
        cwd: workspaceRoot,
        encoding: 'utf-8',
      },
    );
  }

  it("should have a 'test-web-test-runner' target", () => {
    expect(webTestRunnerExampleProject.targets).toMatchObject({
      [webTestRunnerTargetName]: {
        options: {
          command: 'web-test-runner',
        },
      } satisfies TargetConfiguration,
    });
  });

  it(
    "should run the 'Web Test Runner'",
    {
      timeout: 25_000,
    },
    () => {
      expect(() => invokeWebTestRunnerOfExampleProject()).not.toThrow();
    },
  );
});
