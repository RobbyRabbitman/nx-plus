import { workspaceRoot } from '@nx/devkit';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';
import { join } from 'path';
import { defineConfig } from 'vitest/config';

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

  const config = defineConfig({
    test: {
      globals: true,
      typecheck: {
        enabled: true,
        tsconfig: join(workspaceRoot, project.root, 'tsconfig.spec.json'),
      },
      cache: {
        dir: join(workspaceRoot, 'node_modules/.cache/vitest', project.root),
      },
      environment: 'node',
      reporters: ['default'],
      coverage: {
        clean: true,
        reportsDirectory: join(workspaceRoot, 'coverage', project.root),
        reporter: ['v8'],
      },
    },
  });

  if (verbose) {
    console.warn(config);
  }

  return config;
};

export default x();
