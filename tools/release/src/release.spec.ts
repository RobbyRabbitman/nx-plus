import { logger } from '@nx/devkit';
import { releaseChangelog, releaseVersion } from 'nx/release';
import { releaseNxPlus } from './release.js';

vi.mock('nx/release');
vi.mock('@nx/devkit');

describe('[Unit Test] releaseNxPlus', () => {
  beforeEach(() => {
    vi.mocked(releaseVersion).mockResolvedValue({
      workspaceVersion: '1.2.3',
      projectsVersionData: {},
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be a dry run by default', async () => {
    await releaseNxPlus({
      dryRun: true,
    });

    expect(releaseVersion).toHaveBeenCalledWith(
      expect.objectContaining({ dryRun: true }),
    );
  });

  it('should throw when trying to release independly', async () => {
    vi.mocked(releaseVersion).mockResolvedValueOnce({
      workspaceVersion: undefined,
      projectsVersionData: {},
    });

    await expect(releaseNxPlus()).rejects.toThrowError(
      '[release] Trying to release independently!',
    );

    expect(releaseChangelog).not.toHaveBeenCalled();
  });

  it('should be a noop when no changes were made since the last release', async () => {
    vi.mocked(releaseVersion).mockResolvedValueOnce({
      workspaceVersion: null,
      projectsVersionData: {},
    });

    await releaseNxPlus();

    expect(logger.info).toHaveBeenCalledWith(
      '[release] No changes were made since the last release - skipping release.',
    );

    expect(releaseChangelog).not.toHaveBeenCalled();
  });

  it('should commit after the changelog has been created', async () => {
    await releaseNxPlus();

    expect(releaseVersion).toHaveBeenCalledWith(
      expect.objectContaining({ gitCommit: false, gitTag: false }),
    );
    expect(releaseChangelog).toHaveBeenCalledWith(
      expect.objectContaining({ gitCommit: true, gitTag: true }),
    );
  });
});
