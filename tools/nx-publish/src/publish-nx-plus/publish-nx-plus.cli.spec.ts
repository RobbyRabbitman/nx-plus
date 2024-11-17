import { hideBin } from 'yargs/helpers';
import {
  publishNxPlus,
  publishNxPlusDefaultOptions,
} from './publish-nx-plus.js';

/** NOTE: mocking builder pattern yargs seems painful */
// vi.mock('yargs');
vi.mock('yargs/helpers');
vi.mock('./publish-nx-plus.js');
vi.mock('@nx/devkit');

describe('[Unit Test] publishNxPlusCli', () => {
  const args = '--npmRegistry https://some.registry --npmTag some-tag';

  beforeEach(() => {
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });

    vi.mocked(publishNxPlusDefaultOptions).mockReturnValue({
      dryRun: true,
    } satisfies ReturnType<typeof publishNxPlusDefaultOptions>);

    vi.mocked(hideBin).mockReturnValue(args.split(' '));

    vi.mocked(publishNxPlus).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.mocked(process.exit).mockRestore();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('should invoke publishNxPlus with the parsed args', async () => {
    await expect(import('./publish-nx-plus.cli.js')).rejects.toEqual(
      new Error('process.exit(0)'),
    );

    expect(publishNxPlus).toHaveBeenCalledWith({
      dryRun: true,
      npmRegistry: 'https://some.registry',
      npmTag: 'some-tag',
    } satisfies Parameters<typeof publishNxPlus>[0]);
  });

  it('should demand a npm registry', async () => {
    vi.mocked(hideBin).mockReturnValue([]);

    await expect(import('./publish-nx-plus.cli.js')).rejects.toEqual(
      new Error('process.exit(1)'),
    );
  });
});
