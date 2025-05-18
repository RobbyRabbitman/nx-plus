import {
  readCachedProjectGraph,
  workspaceRoot,
  type TargetConfiguration,
} from '@nx/devkit';
import webDevServerExampleProjectPackageJson from '@robby-rabbitman/nx-plus-examples-web-dev-server/package.json';
import { spawn } from 'child_process';

describe('[e2e Test] Web Dev Server', () => {
  const webDevServerExampleProjectName =
    webDevServerExampleProjectPackageJson.nx.name;

  const webDevServerExampleProject =
    readCachedProjectGraph().nodes[webDevServerExampleProjectName]!.data;

  const webDevServerTargetName = 'serve';
  const webDevServerPort = 8080;

  function runWebDevServerOfExampleProject() {
    return spawn(
      'pnpm',
      `nx run ${webDevServerExampleProjectName}:${webDevServerTargetName} --port ${webDevServerPort}`.split(
        ' ',
      ),
      {
        cwd: workspaceRoot,
        detached: true,
      },
    );
  }

  it("should have a 'test-web-test-runner' target", () => {
    expect(webDevServerExampleProject.targets).toMatchObject({
      [webDevServerTargetName]: {
        options: {
          command: 'web-dev-server',
        },
      } satisfies TargetConfiguration,
    });
  });

  it(
    "should run the 'Web Dev Server'",
    {
      timeout: 25_000,
    },
    async () => {
      const serveProcess = runWebDevServerOfExampleProject();

      let served = false;
      let attempt = 0;
      let response!: Response;
      const maxAttempts = 10;

      while (!served && attempt < maxAttempts) {
        attempt++;

        try {
          response = await fetch(
            `http://localhost:${webDevServerPort}/index.html`,
          );

          if (response.status === 200) {
            served = true;
            break;
          }
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      await expect(response.text()).resolves.toContain(
        '<title>@robby-rabbitman/nx-plus-examples-web-dev-server</title>',
      );

      if (serveProcess.pid && !serveProcess.killed) {
        process.kill(-serveProcess.pid);
      }
    },
  );
});
