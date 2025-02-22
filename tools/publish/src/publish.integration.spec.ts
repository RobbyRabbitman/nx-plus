import { VERDACCIO_URL } from '@robby-rabbitman/nx-plus-tools-verdaccio';
import { execSync } from 'child_process';
import { publishNxPlus } from './publish.js';

describe.todo(
  '[Integration Test] publishNxPlus',
  {
    timeout: 0,
  },
  () => {
    const npmRegistry = VERDACCIO_URL;
    const npmTag = 'integration-test';

    describe.todo('by default', () => {
      it('should be a dry run', async () => {
        await publishNxPlus({ npmRegistry, npmTag });
      });
    });

    it('should publish to a npm registry', async () => {
      const nxPlusWebTestRunnerPackageName =
        '@robby-rabbitman/nx-plus-web-test-runner';
      const uniqueNpmTag = `integration-test-${Date.now()}`;

      const nxPlusWebTestRunnerTestTag = `${nxPlusWebTestRunnerPackageName}@${uniqueNpmTag}`;

      const pnpmViewNxPlusWebTestRunner = () =>
        execSync(
          `pnpm view ${nxPlusWebTestRunnerTestTag} --registry ${npmRegistry}`,
          { encoding: 'utf8' },
        );

      expect(
        () => pnpmViewNxPlusWebTestRunner(),
        `Expect ${nxPlusWebTestRunnerTestTag} not to be published in ${npmRegistry}`,
      ).toThrow();

      await publishNxPlus({ dryRun: false, npmRegistry, npmTag: uniqueNpmTag });

      expect(
        () => pnpmViewNxPlusWebTestRunner(),
        `Expect ${nxPlusWebTestRunnerTestTag} to be published in ${npmRegistry}`,
      ).not.throw();
    });
  },
);
