import { execSync } from 'child_process';

describe('vitest local registry config', () => {
  it('should publish this workspace', () => {
    const expectedToBePublished = [
      '@robby-rabbitman/nx-plus-web-test-runner',
      '@robby-rabbitman/nx-plus-web-dev-server',
    ];

    // TODO add port to local registry publish script
    const localRegistry = 'http://localhost:4321/';
    const npmJsOrgRegsitry = 'https://registry.npmjs.org/';

    for (const expectedPackage of expectedToBePublished) {
      expect(() =>
        execSync(
          `pnpm view ${expectedPackage}@local --registry ${npmJsOrgRegsitry}`,
        ),
      ).toThrow();
      expect(() =>
        execSync(
          `pnpm view ${expectedPackage}@local --registry ${localRegistry}`,
        ),
      ).not.toThrow();
    }
  });
});
