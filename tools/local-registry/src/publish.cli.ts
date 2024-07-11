import yargs from 'yargs';
import { localRegistryTarget, publish } from './publish';

(async () => {
  const options = await yargs(process.argv.slice(2))
    .option('specifier', {
      description: 'https://nx.dev/nx-api/nx/documents/release#specifier',
      type: 'string',
      default: `0.0.0-local-${Date.now()}`,
    })
    .option('verbose', {
      type: 'boolean',
      default: true,
    })
    .option('storage', {
      type: 'string',
      default: 'tmp/tools-local-registry/storage',
    })
    .option('tag', {
      type: 'string',
      default: 'local',
    })
    .option('clearStorage', {
      type: 'boolean',
      default: true,
    })
    .option('projects', {
      type: 'array',
      string: true,
      default: [],
    })
    .option('stopLocalRegistry', {
      type: 'boolean',
      default: true,
    })
    .option('localRegistryTarget', {
      type: 'string',
      default: localRegistryTarget,
    })
    .parseAsync();

  const { publishStatus } = await publish({
    ...options,
  });
  process.exit(publishStatus);
})();
