import { VERDACCIO_URL } from '@robby-rabbitman/nx-plus-tools-verdaccio';

describe('[Integration Test] publishNxPlus', () => {
  const npmRegistry = VERDACCIO_URL;
  const npmTag = 'integration-test';

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('by default', () => {
    // it('should be a dry run', async () => {
    //   await expect(
    //     publishNxPlus({ npmRegistry, npmTag }),
    //   ).rejects.toBeUndefined();
    // });
  });
});
