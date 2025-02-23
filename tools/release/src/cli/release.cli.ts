import { logger } from '@nx/devkit';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { releaseNxPlus, releaseNxPlusDefaultOptions } from '../release.js';

await releaseNxPlusCli();

/** A cli for {@link releaseNxPlus}. */
export async function releaseNxPlusCli() {
  try {
    const defaultOptions = releaseNxPlusDefaultOptions();

    const options = await yargs(hideBin(process.argv))
      .strict()
      .option('dryRun', {
        type: 'boolean',
        default: defaultOptions.dryRun,
      })
      .option('specifier', {
        type: 'string',
      })
      .option('preid', {
        type: 'string',
      })
      .parseAsync();

    logger.verbose('[releaseNxPlus] options', options);

    await releaseNxPlus({
      dryRun: options.dryRun,
      specifier: options.specifier,
      preid: options.preid,
    });

    process.exit(0);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}
