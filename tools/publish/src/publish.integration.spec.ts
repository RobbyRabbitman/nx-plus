import { VERDACCIO_URL } from '@robby-rabbitman/nx-plus-tools-verdaccio';
import { execSync } from 'child_process';
import publishPackageJson from '../package.json' with { type: 'json' };
import { publishNxPlus } from './publish.js';

describe(
  '[Integration Test] publishNxPlus',
  {
    timeout: 0,
  },
  () => {
    const localNpmRegistry = VERDACCIO_URL;

    it('should publish to a npm registry', async () => {
      /**
       * Every npm package of Nx Plus should be published via `publishNxPlus()`
       * but we only check this package and expect the others to be published as
       * well.
       */

      const uniqueNpmTag = `integration-test-${Date.now()}`;

      const publishTestTag = `${publishPackageJson.name}@${uniqueNpmTag}`;

      const viewPublishTestTag = () =>
        execSync(`pnpm view ${publishTestTag} --registry ${localNpmRegistry}`, {
          encoding: 'utf8',
        });

      expect(
        () => viewPublishTestTag(),
        `Expect ${publishTestTag} not to be published in ${localNpmRegistry}`,
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
