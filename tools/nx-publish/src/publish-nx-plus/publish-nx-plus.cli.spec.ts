import { hideBin } from 'yargs/helpers';
import {
  publishNxPlus,
  publishNxPlusDefaultOptions,
} from './publish-nx-plus.js';

/** NOTE: mocking builder pattern yargs seems painful */
// vi.mock('yargs');
vi.mock('yargs/helpers');
vi.mock('./publish-nx-plus.js');

describe('[Unit Test] publishNxPlusCli', () => {
  const args = '--npmRegistry https://some.registry --npmTag some-tag';

  beforeEach(() => {
    vi.mocked(publishNxPlusDefaultOptions).mockReturnValue({
      dryRun: true,
    } satisfies ReturnType<typeof publishNxPlusDefaultOptions>);

    vi.mocked(hideBin).mockReturnValue(args.split(' '));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  describe('by default', () => {
    it('should be a dry run', async () => {
      await import('./publish-nx-plus.cli.js');

      expect(publishNxPlus).toHaveBeenCalledWith(
        expect.objectContaining({
          dryRun: true,
        }),
      );
    });
  });

  it('should invoke publishNxPlus with the parsed args', async () => {
    await import('./publish-nx-plus.cli.js');

    expect(publishNxPlus).toHaveBeenCalledWith(
      expect.objectContaining({
        npmRegistry: 'https://some.registry',
        npmTag: 'some-tag',
      }),
    );
  });
});
