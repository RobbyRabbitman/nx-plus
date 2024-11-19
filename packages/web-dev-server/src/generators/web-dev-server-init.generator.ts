import {
  type ExpandedPluginConfiguration,
  type Generator,
  formatFiles,
  readNxJson,
  updateNxJson,
} from '@nx/devkit';
import { DEFAULT_WEB_DEV_SERVER_TARGET_NAME } from '../plugins/web-dev-server.plugin.js';

export const WEB_DEV_SERVER_PLUGIN_PATH =
  '@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server';

/**
 * TODO: can this type be generated from the schema.json or the json imported
 * and then inferred in order to be synced?
 */
export interface WebDevServerInitGeneratorSchema {
  /**
   * The name of the `web-dev-server` serve target e.g. 'serve' or
   * 'web-dev-server'.
   */
  serveTargetName?: string;

  /** Whether to skip adding the plugin. */
  skipAddPlugin?: boolean;

  /** Whether to skip formatting the updated files. */
  skipFormat?: boolean;
}

export type WebDevServerInitGeneratorOptions =
  Required<WebDevServerInitGeneratorSchema>;

/**
 * Adds the `@robby-rabbitman/nx-plus-web-dev-server/plugins/web-dev-server`
 * plugin to the `nx.json` file.
 */
export const webDevServerInitGenerator: Generator<
  WebDevServerInitGeneratorSchema
> = async (tree, schema) => {
  const defaultWebDevServeTargetName = DEFAULT_WEB_DEV_SERVER_TARGET_NAME;

  const options = {
    skipAddPlugin: false,
    skipFormat: false,
    serveTargetName: defaultWebDevServeTargetName,
    ...schema,
  } satisfies WebDevServerInitGeneratorOptions;

  /** Make sure `serveTargetName` is not an empty string */
  if (options.serveTargetName === '') {
    options.serveTargetName = defaultWebDevServeTargetName;
  }

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
    } satisfies ExpandedPluginConfiguration<WebDevServerInitGeneratorSchema>);

    updateNxJson(tree, nxJson);
  }

  if (!skipFormat) {
    await formatFiles(tree);
  }
};

export default webDevServerInitGenerator;
