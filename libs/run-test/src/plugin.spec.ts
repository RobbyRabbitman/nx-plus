import { readCachedProjectGraph } from '@nx/devkit';

describe('@robby-rabbitman/nx-plus-libs-run-test/plugin', () => {
  it('should run test-jest', () => {
    const project = readCachedProjectGraph().nodes['libs-run-test'];
    expect(project.data.targets['run-test']).toEqual({
      configurations: {},
      executor: 'nx:run-commands',
      options: {
        commands: ['pnpm exec nx run libs-run-test:test-jest'],
      },
    });
  });
});
