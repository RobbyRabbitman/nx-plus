import { releasePublish } from 'nx/release';
import { publishNxPlus } from './publish.js';

vi.mock('@nx/devkit');
vi.mock('nx/release');

describe('[Unit Test] publishNxPlus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be a dry run by default', async () => {
    await publishNxPlus({
      npmRegistry: 'https://some.registry',
      npmTag: 'some-tag',
    });

    expect(releasePublish).toHaveBeenCalledWith(
      expect.objectContaining({
        dryRun: true,
      }),
    );
  });

  describe("should invoke 'releasePublish'", () => {
    it('with the npm registry option', async () => {
      await publishNxPlus({
        npmRegistry: 'https://some.registry',
        npmTag: 'some-tag',
      });

      expect(releasePublish).toHaveBeenCalledWith(
        expect.objectContaining({
          registry: 'https://some.registry',
        }),
      );
    });

    it('with the npm tag option', async () => {
      await publishNxPlus({
        npmRegistry: 'https://some.registry',
        npmTag: 'some-tag',
      });

      expect(releasePublish).toHaveBeenCalledWith(
        expect.objectContaining({
          tag: 'some-tag',
        }),
      );
    });

    it('with the dry run option', async () => {
      await publishNxPlus({
        npmRegistry: 'https://some.registry',
        npmTag: 'some-tag',
        dryRun: false,
      });

      expect(releasePublish).toHaveBeenCalledWith(
        expect.objectContaining({
          dryRun: false,
        }),
      );

      await publishNxPlus({
        npmRegistry: 'https://some.registry',
        npmTag: 'some-tag',
        dryRun: true,
      });

      expect(releasePublish).toHaveBeenCalledWith(
        expect.objectContaining({
          dryRun: true,
        }),
      );
    });
  });
});
