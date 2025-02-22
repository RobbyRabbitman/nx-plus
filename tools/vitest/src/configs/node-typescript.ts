import { logger } from '@nx/devkit';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export function nodeTypescript() {
  const config = defineConfig({
    test: {
      globals: true,
      environment: 'node',
      reporters: ['default', 'hanging-process'],
      typecheck: {
        enabled: true,
        tsconfig: 'tsconfig.spec.json',
      },
      coverage: {
        enabled: true,
        clean: true,
        include: ['src/**/*'],
        exclude: [...coverageConfigDefaults.exclude, '**/index.ts'],
        thresholds: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        reporter: [...coverageConfigDefaults.reporter, 'lcov'],
      },
    },
  });

  logger.verbose('[nodeTypescript] vitest config', config);

  return config;
}
