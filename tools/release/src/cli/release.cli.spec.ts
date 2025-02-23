import { hideBin } from 'yargs/helpers';
import { releaseNxPlus, releaseNxPlusDefaultOptions } from '../release.js';

vi.mock('yargs/helpers');
vi.mock('../release.js');
vi.mock('@nx/devkit');

describe('[Unit Test] releaseNxPlusCli', () => {
  async function invokeReleaseNxPlusCli(args: string) {
    vi.spyOn(process, 'exit').mockImplementationOnce(() => undefined as never);

    vi.mocked(hideBin).mockReturnValue(args.split(' '));

    await import('./release.cli.js');
  }

  function stubReleaseNxPlusCliDefaultOptions() {
    vi.mocked(releaseNxPlusDefaultOptions).mockReturnValue({
      dryRun: true,
    });
  }

  function stubReleaseNxPlusCli() {
    vi.mocked(releaseNxPlus).mockResolvedValue(undefined);
  }

  beforeEach(() => {
    stubReleaseNxPlusCliDefaultOptions();
    stubReleaseNxPlusCli();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("should invoke 'releaseNxPlus()' with the parsed args", async () => {
    await invokeReleaseNxPlusCli('--specifier major --preid rc --dryRun false');

    expect(releaseNxPlus).toHaveBeenCalledWith({
      dryRun: false,
      specifier: 'major',
      preid: 'rc',
    } satisfies Parameters<typeof releaseNxPlus>[0]);

    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it("should exit with 1 if 'releaseNxPlus()' throws", async () => {
    vi.mocked(releaseNxPlus).mockRejectedValue(new Error('Oopsie!'));

    await invokeReleaseNxPlusCli('--specifier major --preid rc --dryRun false');

    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
