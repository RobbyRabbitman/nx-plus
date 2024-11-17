import { VERDACCIO_URL } from '@robby-rabbitman/nx-plus-tools-verdaccio';
import { publishNxPlus } from './publish-nx-plus.js';

describe('[Integration Test] publishNxPlus', () => {
  const npmRegistry = VERDACCIO_URL;
  const npmTag = 'integration-test';

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('by default', () => {
    it('should be a dry run', async () => {
      await publishNxPlus({
        npmRegistry,
        npmTag,
      });
    });
  });
});
