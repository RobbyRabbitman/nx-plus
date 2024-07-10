import { workspaceRoot } from '@nx/devkit';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';
import { join } from 'path';
import { UserConfig } from 'vitest';

const x = () => {
  const projectName = process.env['NX_TASK_TARGET_PROJECT'];

  if (!projectName) {
    // throw new Error(
    //   'NX_TASK_TARGET_PROJECT is not defined. Running a Nx command?',
    // );
    return {};
  }

  const project = readCachedProjectConfiguration(projectName);

  if (!project) {
    // throw new Error(
    //   'NX_TASK_TARGET_PROJECT is not defined. Running a Nx command?',
    // );
    return {};
  }

  const config = {
    globals: true,
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

  console.warn(config);

  return config;
};

export default x();
