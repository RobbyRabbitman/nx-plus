import { workspaceRoot } from '@nx/devkit';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';
import { join } from 'path';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

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
    root: join(workspaceRoot, project.root),
    cacheDir: join(workspaceRoot, 'node_modules/.cache/vitest', project.root),
    test: {
      globals: true,
      typecheck: {
        enabled: true,
        tsconfig: join(workspaceRoot, project.root, 'tsconfig.spec.json'),
      },
      environment: 'node',
      reporters: ['default'],
      coverage: {
        clean: true,
        exclude: [...coverageConfigDefaults.exclude, '**/index.ts'],
        thresholds: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        reportsDirectory: join(workspaceRoot, 'coverage', project.root),
      },
    },
  });

  if (verbose) {
    console.warn(config);
  }

  return config;
};

export default x();
