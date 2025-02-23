import { VERDACCIO_URL } from '@robby-rabbitman/nx-plus-tools-verdaccio';
import { execSync } from 'child_process';
import { publishNxPlus } from './publish.js';

describe(
  '[Integration Test] publishNxPlus',
  {
    timeout: 0,
  },
  () => {
    const localNpmRegistry = VERDACCIO_URL;

    it('should publish to a npm registry', async () => {
      const uniqueNpmTag = `integration-test-${Date.now()}`;

      const nxPluswebTestRunnerTestTag = `@robby-rabbitman/nx-plus-web-test-runner@${uniqueNpmTag}`;

      const viewPublishTestTag = () =>
        execSync(
          `pnpm view ${nxPluswebTestRunnerTestTag} --registry ${localNpmRegistry}`,
          {
            encoding: 'utf8',
          },
        );

      expect(
        () => viewPublishTestTag(),
        `Expect ${nxPluswebTestRunnerTestTag} not to be published in ${localNpmRegistry}`,
      ).toThrow();

      await publishNxPlus({
        dryRun: false,
        npmRegistry: localNpmRegistry,
        npmTag: uniqueNpmTag,
      });

      expect(() => viewPublishTestTag()).not.throw();
    });
  },
);
