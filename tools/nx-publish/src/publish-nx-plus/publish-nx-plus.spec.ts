import { releasePublish } from 'nx/release';
import {
  publishNxPlus,
  publishNxPlusDefaultOptions,
} from './publish-nx-plus.js';

vi.mock('@nx/devkit');
vi.mock('nx/release');

describe('[Unit Test] publishNxPlus', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('by default', () => {
    it('should be a dry run', async () => {
      expect(publishNxPlusDefaultOptions().dryRun).toBe(true);

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
  });

  describe("should invoke 'releasePublish'", () => {
    it('with the npm registry', async () => {
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

    it('with the npm tag', async () => {
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
  });
});
