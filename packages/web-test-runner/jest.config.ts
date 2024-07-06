import { Config } from 'jest';
import { join, relative } from 'node:path';

const projectName = process.env.NX_TASK_TARGET_PROJECT ?? '';
const workspaceRoot = process.env.NX_WORKSPACE_ROOT ?? '';
const absoluteProjectRoot = process.cwd();
const projectRoot = relative(workspaceRoot, absoluteProjectRoot);

/* eslint-disable */
export default projectName
  ? ({
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
      coverageDirectory: join(workspaceRoot, 'coverage', projectRoot),
    } satisfies Config)
  : {};
