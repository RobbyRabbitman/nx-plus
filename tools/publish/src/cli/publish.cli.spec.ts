import { hideBin } from 'yargs/helpers';
import { publishNxPlus, publishNxPlusDefaultOptions } from '../publish.js';

vi.mock('yargs/helpers');
vi.mock('../publish.js');
vi.mock('@nx/devkit');

describe('[Unit Test] publishNxPlusCli', () => {
  async function invokePublishNxPlusCli(args: string) {
    vi.spyOn(process, 'exit').mockImplementationOnce(() => undefined as never);

    vi.mocked(hideBin).mockReturnValue(args.split(' '));

    await import('./publish.cli.js');
  }

  function stubPublishNxPlusDefaultOptions() {
    vi.mocked(publishNxPlusDefaultOptions).mockReturnValue({
      dryRun: true,
    });
  }

  function stubPublishNxPlus() {
    vi.mocked(publishNxPlus).mockResolvedValue(undefined);
  }

  beforeEach(() => {
    stubPublishNxPlusDefaultOptions();
    stubPublishNxPlus();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("should invoke 'publishNxPlus()' with the parsed args", async () => {
    await invokePublishNxPlusCli(
      '--npmRegistry https://some.registry --npmTag some-tag',
    );

    expect(publishNxPlus).toHaveBeenCalledWith({
      dryRun: true,
      npmRegistry: 'https://some.registry',
      npmTag: 'some-tag',
    } satisfies Parameters<typeof publishNxPlus>[0]);

    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should demand a npm registry', async () => {
    await invokePublishNxPlusCli('');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
