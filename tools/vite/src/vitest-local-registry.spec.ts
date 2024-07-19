import { execSync } from 'child_process';

describe('vitest local registry config', () => {
  it('should publish this workspace', () => {
    const expectedToBePublished = [
      '@robby-rabbitman/nx-plus-web-test-runner',
      '@robby-rabbitman/nx-plus-web-dev-server',
    ];
    const localRegistry = 'http://localhost:4321/';
    const npmjsOrgRegsitry = 'https://registry.npmjs.org/';

    for (const expectedPackage of expectedToBePublished) {
      expect(() =>
        execSync(
          `npm view ${expectedPackage}@local --registry ${npmjsOrgRegsitry}`,
        ),
      ).toThrow();
      expect(() =>
        execSync(
          `npm view ${expectedPackage}@local --registry ${localRegistry}`,
        ),
      ).not.toThrow();
    }
  });
});
