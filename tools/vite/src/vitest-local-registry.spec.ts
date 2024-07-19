import { execSync } from 'child_process';

describe('vitest local registry config', () => {
  it('should publish this workspace', () => {
    const expectedToBePublished = [
      '@robby-rabbitman/nx-plus-web-test-runner',
      '@robby-rabbitman/nx-plus-web-dev-server',
    ];
    const registry = 'http://localhost:4321/';

    for (const expectedPackage of expectedToBePublished) {
      expect(() => execSync(`npm view ${expectedPackage}@local `)).toThrow();
      expect(() =>
        execSync(`npm view ${expectedPackage}@local --registry ${registry}`),
      ).not.toThrow();
    }
  });
});
