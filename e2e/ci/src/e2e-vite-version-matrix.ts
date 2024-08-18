import {
  getPackageManagerCommand,
  logger,
  readCachedProjectGraph,
  workspaceRoot,
} from '@nx/devkit';
import { execSync } from 'child_process';
import { join } from 'path';
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  localRegistryTarget,
  publish,
} from '../../../tools/local-registry/src/publish';

(async () => {
  const projectName = process.env['NX_TASK_TARGET_PROJECT'];
  const verbose = process.env['NX_VERBOSE_LOGGING'] === 'true';

  const project = readCachedProjectGraph().nodes[projectName].data;

  const { stopLocalRegistry } = await publish({
    clearStorage: true,
    stopLocalRegistry: false,
    tag: 'local',
    specifier: '0.0.0-local',
    storage: join(workspaceRoot, 'dist/e2e/ci', project.root),
    projects: [],
    verbose,
    localRegistryTarget,
  });

  try {
    execSync(
      `${getPackageManagerCommand().exec} nx run web-test-runner-e2e:e2e-vite-version-matrix---nx@^19---@web/test-runner@^0.18.2`,
      {
        cwd: workspaceRoot,
        stdio: 'inherit',
      },
    );
  } catch (error) {
    logger.error(error);
    process.exit(1);
  } finally {
    stopLocalRegistry();
  }

  process.exit();
})();
