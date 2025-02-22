import { logger } from '@nx/devkit';
import { releasePublish } from 'nx/release';

/** @see {@link publishNxPlus} */
export type PublishNxPlusOptions = {
  /** Where to publish the npm packages of the Nx Plus workspace. */
  npmRegistry: string;

  /** The tag to use when publishing the npm packages of the Nx Plus workspace */
  npmTag?: string;
} & Pick<Parameters<typeof releasePublish>[0], 'dryRun'>;

export function publishNxPlusDefaultOptions() {
  return {
    dryRun: true,
  } satisfies Partial<PublishNxPlusOptions>;
}

/** Publishes the Nx Plus workspace. */
export async function publishNxPlus(userOptions: PublishNxPlusOptions) {
  const defaultOptions = publishNxPlusDefaultOptions();

  const normalizedOptions = {
    ...defaultOptions,
    ...userOptions,
  };

  logger.verbose('[publishNxPlus] defaultOptions:', defaultOptions);
  logger.verbose('[publishNxPlus] userOptions:', userOptions);
  logger.verbose('[publishNxPlus] normalizedOptions:', normalizedOptions);

  const { dryRun, npmRegistry, npmTag } = normalizedOptions;

  await releasePublish({
    dryRun,
    registry: npmRegistry,
    tag: npmTag,
  });
}
