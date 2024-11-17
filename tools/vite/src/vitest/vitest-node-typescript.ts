import { logger, readCachedProjectGraph, workspaceRoot } from '@nx/devkit';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { join } from 'path';
import {
  coverageConfigDefaults,
  defineConfig,
  mergeConfig,
  type UserConfig,
} from 'vitest/config';

/**
 * Vitest config for a nx project:
 *
 * - Cache
 * - Ts paths via `nxViteTsPaths` plugin
 * - Test files typechecking
 * - Coverage
 */
export function nodeTypescript(overrides?: Partial<UserConfig>) {
  const projectName = process.env['NX_TASK_TARGET_PROJECT'];

  if (!projectName) {
    return {};
  }

  const project = readCachedProjectGraph().nodes[projectName]?.data;

  if (!project) {
    return {};
  }

  const config = defineConfig({
    root: join(workspaceRoot, project.root),
    cacheDir: join(workspaceRoot, 'node_modules/.cache/vitest', project.root),
    plugins: [nxViteTsPaths()],
    server: {
      host: true,
    },
    test: {
      globals: true,
      typecheck: {
        enabled: true,
        tsconfig: join(workspaceRoot, project.root, 'tsconfig.spec.json'),
      },
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
