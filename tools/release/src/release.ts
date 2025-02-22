import { logger } from '@nx/devkit';
import { releaseChangelog, releaseVersion } from 'nx/release';

/** @see {@link releaseNxPlus} */
export interface ReleaseNxPlusOptions {
  /** Whether to run the release in dry-run mode. */
  dryRun?: boolean;

  /** https://nx.dev/nx-api/nx/documents/release#specifier */
  specifier?: string;

  /** https://nx.dev/nx-api/nx/documents/release#preid */
  preid?: string;
}

/**
 * Releases Nx Plus.
 *
 * - All projects are released together.
 * - Bumbs version in all projects
 * - Updates changelog
 *
 * @see {@link https://nx.dev/nx-api/nx/documents/release#version}
 * @see {@link https://nx.dev/nx-api/nx/documents/release#changelog}
 */
export async function releaseNxPlus(options?: ReleaseNxPlusOptions) {
  const verbose = process.env.NX_VERBOSE_LOGGING === 'true';

  const defaultOptions = {
    dryRun: true,
  } satisfies Partial<ReleaseNxPlusOptions>;

  const normalizedOptions = {
    ...defaultOptions,
    ...options,
  } satisfies ReleaseNxPlusOptions;

  const { dryRun, preid, specifier } = normalizedOptions;

  const { workspaceVersion, projectsVersionData } = await releaseVersion({
    specifier,
    dryRun,
    verbose,
    preid,
    /**
     * Dont commit or tag here => do it after the changelog was created, see
     * below.
     */
    gitCommit: false,
    gitTag: false,
  });

  if (workspaceVersion === undefined) {
    throw new Error('[release] Trying to release independently!');
  }

  if (workspaceVersion === null) {
    logger.info(
      '[release] No changes were made since the last release - skipping release.',
    );

    return;
  }

  await releaseChangelog({
    versionData: projectsVersionData,
    version: workspaceVersion,
    dryRun,
    verbose,
    gitCommit: true,
    gitTag: true,
    gitCommitMessage: `chore: release ${workspaceVersion} 🚀`,
  });
}
