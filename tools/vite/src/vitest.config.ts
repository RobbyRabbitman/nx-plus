import { workspaceRoot } from '@nx/devkit';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';
import { join } from 'path';
import {
  coverageConfigDefaults,
  defineConfig,
  mergeConfig,
  UserConfig,
} from 'vitest/config';

export function config(overrides?: Partial<UserConfig>) {
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
    plugins: [nxViteTsPaths()],
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
        provider: 'v8',
        reportsDirectory: join(workspaceRoot, 'coverage', project.root),
      },
    },
  });

  const mergedConfig = mergeConfig(config as UserConfig, overrides ?? {});

  if (verbose) {
    console.log(mergedConfig);
  }

  return mergedConfig;
}

export function withLocalRegistry(overrides?: Partial<UserConfig>) {
  return mergeConfig(
    config({
      test: {
        globalSetup: [
          '@robby-rabbitman/nx-plus-tools-vite/local-registry-setup',
        ],
      },
    }),
    overrides ?? {},
  );
}
