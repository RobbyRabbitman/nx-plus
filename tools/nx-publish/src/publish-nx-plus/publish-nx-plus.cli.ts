import { logger } from '@nx/devkit';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  publishNxPlus,
  publishNxPlusDefaultOptions,
} from './publish-nx-plus.js';

export const publishNxPlusCli = async () => {
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
};

await publishNxPlusCli().then(
  () => process.exit(0),
  (error) => {
    logger.error(error);
    process.exit(1);
  },
);
