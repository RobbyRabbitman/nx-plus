import { readCachedProjectConfiguration } from 'nx/src/project-graph/project-graph';

describe('@robby-rabbitman/nx-plus-libs-run-test/plugin', () => {
  it('should run test-jest', () => {
    const project = readCachedProjectConfiguration('libs-run-test');
    expect(project.targets['run-test']).toEqual({
      configurations: {},
      executor: 'nx:run-commands',
      options: {
        commands: ['pnpm exec nx run libs-run-test:test-jest'],
      },
    });
  });
});
