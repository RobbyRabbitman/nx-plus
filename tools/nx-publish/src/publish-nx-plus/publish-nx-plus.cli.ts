import { logger } from '@nx/devkit';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  publishNxPlus,
  publishNxPlusDefaultOptions,
} from './publish-nx-plus.js';

export const publishNxPlusCli = async () => {
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

    const { publishStatus } = await publishNxPlus(options);

    process.exit(publishStatus);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

await publishNxPlusCli();