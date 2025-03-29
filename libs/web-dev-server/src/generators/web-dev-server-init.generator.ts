import {
  type ExpandedPluginConfiguration,
  type Generator,
  formatFiles,
  readNxJson,
  updateNxJson,
} from '@nx/devkit';
import { DEFAULT_WEB_DEV_SERVER_TARGET_NAME } from '../plugins/web-dev-server.plugin';
import { WebDevServerInitGeneratorOptions } from './web-dev-server-init.generator.schema';

const WEB_DEV_SERVER_PLUGIN_PATH =
  '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server';

/**
 * Adds the `@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server`
 * plugin to the `nx.json` file.
 */
export const webDevServerInitGenerator: Generator<
  WebDevServerInitGeneratorOptions
> = async (tree, schema) => {
  const options = normalizeWebDevServerInitGeneratorOptions(schema);

  const { skipAddPlugin, skipFormat } = options;

  if (skipAddPlugin) {
    return;
  }

  const nxJson = readNxJson(tree) ?? {};
  nxJson.plugins ??= [];

  const hasWebDevServerPlugin = nxJson.plugins.some((pluginConfig) => {
    /**
     * `pluginConfig` can be a string representing the plugin name or a object
     * with a plugin property representing the plugin name
     */

    if (typeof pluginConfig === 'string') {
      return pluginConfig === WEB_DEV_SERVER_PLUGIN_PATH;
    }

    return pluginConfig.plugin === WEB_DEV_SERVER_PLUGIN_PATH;
  });

  /** When the plugin is not already added to the `nx.json` file, add it. */
  if (!hasWebDevServerPlugin) {
    nxJson.plugins.push({
      plugin: WEB_DEV_SERVER_PLUGIN_PATH,
      options: {
        serveTargetName: options.serveTargetName,
      },
    } satisfies ExpandedPluginConfiguration<WebDevServerInitGeneratorOptions>);

    updateNxJson(tree, nxJson);
  }

  if (!skipFormat) {
    await formatFiles(tree);
  }
};

export default webDevServerInitGenerator;

function normalizeWebDevServerInitGeneratorOptions(
  userOptions?: WebDevServerInitGeneratorOptions,
) {
  const normalizedOptions = {
    skipAddPlugin: false,
    skipFormat: false,
    serveTargetName: DEFAULT_WEB_DEV_SERVER_TARGET_NAME,
    ...userOptions,
  } satisfies WebDevServerInitGeneratorOptions;

  /** Make sure `serveTargetName` is not an empty string */
  if (normalizedOptions.serveTargetName === '') {
    normalizedOptions.serveTargetName = DEFAULT_WEB_DEV_SERVER_TARGET_NAME;
  }

  return normalizedOptions;
}
