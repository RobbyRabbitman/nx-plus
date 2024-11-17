import { VERDACCIO_URL } from '@robby-rabbitman/nx-plus-tools-verdaccio';
import { spawnSync } from 'child_process';
import { publishNxPlus } from './publish-nx-plus.js';

describe(
  '[Integration Test] publishNxPlus',
  {
    timeout: 0,
  },
  () => {
    const npmRegistry = VERDACCIO_URL;
    const npmTag = 'integration-test';

    afterEach(() => {
      vi.restoreAllMocks();
    });

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
        spawnSync(
          'pnpm',
          `view ${nxPlusWebTestRunnerTestTag} --registry ${npmRegistry}`.split(
            ' ',
          ),
          { encoding: 'utf8' },
        );

      const pnpmViewResultBeforePublishing = pnpmViewNxPlusWebTestRunner();

      expect(
        pnpmViewResultBeforePublishing.status,
        `Expect ${nxPlusWebTestRunnerTestTag} not to be published in ${npmRegistry}`,
      ).toBe(1);

      await publishNxPlus({ dryRun: false, npmRegistry, npmTag: uniqueNpmTag });

      const pnpmViewResultAfterPublishing = pnpmViewNxPlusWebTestRunner();

      expect(
        pnpmViewResultAfterPublishing.status,
        `Expect ${nxPlusWebTestRunnerTestTag} to be published in ${npmRegistry}`,
      ).toBe(0);
    });
  },
);
