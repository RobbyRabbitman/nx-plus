import { workspaceRoot } from '@nx/devkit';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';
import { join } from 'path';
import { UserConfig } from 'vitest';

const x = () => {
  const projectName = process.env['NX_TASK_TARGET_PROJECT'];
  const verbose = process.env['NX_VERBOSE_LOGGING'] === 'true';

  if (!projectName) {
    return {};
  }

  const project = readCachedProjectConfiguration(projectName);

  if (!project) {
    return {};
  }

  const config = {
    globals: true,
    typecheck: {
      enabled: true,
      tsconfig: join(workspaceRoot, project.root, 'tsconfig.spec.json'),
    },
    cache: {
      dir: '../node_modules/.vitest/<project-root>',
    },
    environment: 'node',
    reporters: ['default'],
    coverage: {
      reportsDirectory: join(workspaceRoot, 'coverage', project.root),
      reporter: ['v8'],
    },
  } satisfies UserConfig;

  if (verbose) {
    console.warn(config);
  }

  return config;
};

export default x();
