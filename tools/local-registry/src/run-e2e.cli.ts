import yargs from 'yargs';
import { runE2e } from './run-e2e';

(async () => {
  const options = await yargs(process.argv.slice(2))
    .option('e2eProjectName', {
      type: 'string',
      required: true,
    })
    .option('e2eTarget', {
      type: 'string',
      required: true,
    })

    .parseAsync();

  try {
    await runE2e(options);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
