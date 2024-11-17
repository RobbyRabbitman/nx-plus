import { logger } from '@nx/devkit';
import { releasePublish } from 'nx/release';

export type PublishNxPlusOptions = {
  npmRegistry: string;
} & Pick<Parameters<typeof releasePublish>[0], 'dryRun'>;

export const publishNxPlusDefaultOptions = () =>
  ({
    dryRun: true,
  }) satisfies Partial<PublishNxPlusOptions>;

export const publishNxPlus = async (options: PublishNxPlusOptions) => {
  const defaultOptions = publishNxPlusDefaultOptions();

  const combinedOptions = {
    ...defaultOptions,
    ...options,
  };

  logger.verbose('[publishNxPlus] defaultOptions:', defaultOptions);
  logger.verbose('[publishNxPlus] options:', options);
  logger.verbose('[publishNxPlus] combinedOptions:', combinedOptions);

  const { dryRun, npmRegistry } = combinedOptions;

  const publishStatus = await releasePublish({
    dryRun,
    registry: npmRegistry,
  });

  logger.verbose('[publishNxPlus] publish status:', publishStatus);

  return { publishStatus };
};
