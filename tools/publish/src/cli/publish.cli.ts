import { logger } from '@nx/devkit';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { publishNxPlus, publishNxPlusDefaultOptions } from '../publish.js';

await publishNxPlusCli();

/** A cli for {@link publishNxPlus}. */
export async function publishNxPlusCli() {
  try {
    const defaultOptions = publishNxPlusDefaultOptions();

    const options = await yargs(hideBin(process.argv))
      .strict()
      .option('dryRun', {
        type: 'boolean',
        default: defaultOptions.dryRun,
      })
      .option('npmRegistry', {
        type: 'string',
        demandOption: true,
      })
      .option('npmTag', {
        type: 'string',
      })
      .parseAsync();

    await publishNxPlus({
      npmRegistry: options.npmRegistry,
      npmTag: options.npmTag,
      dryRun: options.dryRun,
    });

    process.exit(0);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}
