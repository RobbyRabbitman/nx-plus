import { Config } from 'jest';
import { join, relative } from 'node:path';

export const jestConfig = (config?: Partial<Config>): Config => {
  const projectName = process.env['NX_TASK_TARGET_PROJECT'];
  const workspaceRoot = process.env['NX_WORKSPACE_ROOT'];

  if (!projectName || !workspaceRoot) {
    return {};
  }

  const absoluteProjectRoot = process.cwd();
  const projectRoot = relative(workspaceRoot, absoluteProjectRoot);

  return {
    displayName: projectName,
    preset: relative(
      absoluteProjectRoot,
      join(workspaceRoot, 'jest.preset.js'),
    ),
    transform: {
      '^.+\\.[tj]s$': [
        'ts-jest',
        {
          tsconfig: join(workspaceRoot, projectRoot, 'tsconfig.spec.json'),
        },
      ],
    },
    moduleFileExtensions: ['ts', 'js'],
    coverageThreshold: {
      global: {
        branches: 95,
        functions: 95,
        lines: 95,
        statements: 95,
      },
    },
    coverageDirectory: join(workspaceRoot, 'coverage', projectRoot),
    ...config,
  };
};
