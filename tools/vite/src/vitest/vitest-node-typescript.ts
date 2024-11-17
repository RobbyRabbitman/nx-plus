import { logger, readCachedProjectGraph, workspaceRoot } from '@nx/devkit';
import { join } from 'path';
import {
  coverageConfigDefaults,
  defineConfig,
  mergeConfig,
  type UserConfig,
} from 'vitest/config';

export function nodeTypescript(overrides?: Partial<UserConfig>) {
  const projectName = process.env['NX_TASK_TARGET_PROJECT'];

  if (!projectName) {
    logger.verbose(
      '[nodeTypescript] NX_TASK_TARGET_PROJECT is not set. Are you a nx task?',
    );
    return {};
  }

  const project = readCachedProjectGraph().nodes[projectName]?.data;

  if (!project) {
    logger.verbose(
      `[nodeTypescript] Project ${projectName} does not exist in the project graph.`,
    );
    return {};
  }

  const config = defineConfig({
    root: join(workspaceRoot, project.root),
    cacheDir: join(workspaceRoot, 'node_modules/.cache/vitest', project.root),
    server: {
      host: true,
    },
    test: {
      globals: true,
      environment: 'node',
      reporters: ['default'],
      coverage: {
        enabled: true,
        clean: true,
        exclude: [...coverageConfigDefaults.exclude, '**/index.ts'],
        thresholds: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        provider: 'v8',
        reportsDirectory: join(workspaceRoot, 'coverage', project.root),
        reporter: [...coverageConfigDefaults.reporter, 'lcov'],
      },
    },
  });

  const combinedConfig = mergeConfig(config, overrides ?? {});

  logger.verbose('[nodeTypescript] config', config);
  logger.verbose('[nodeTypescript] overrides', overrides);
  logger.verbose('[nodeTypescript] combinedConfig', combinedConfig);

  return combinedConfig;
}
