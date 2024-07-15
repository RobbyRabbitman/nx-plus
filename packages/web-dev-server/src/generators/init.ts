import {
  ExpandedPluginConfiguration,
  Generator,
  formatFiles,
  readNxJson,
  updateNxJson,
} from '@nx/devkit';

// TODO: import the package.json and read the name? :D
export const WEB_DEV_SERVER_PLUGIN_NAME =
  '@robby-rabbitman/nx-plus-web-dev-server/plugin';

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
 * 1. Adds `@robby-rabbitman/nx-plus-web-dev-server/plugin` to the `plugins` of the
 *    `nx.json` when not already included. Can be skipped with `skipAddPlugin`.
 * 2. Formats the updated files. Can be skipped with `skipFormat`.
 *
 * @param {WebDevServerInitGeneratorSchema} [schema.serveTargetName="serve"]
 *   Default is `"serve"`
 * @param {WebDevServerInitGeneratorSchema} [schema.skipAddPlugin=true] Default
 *   is `true`
 * @param {WebDevServerInitGeneratorSchema} [schema.skipFormat=true] Default is
 *   `true`
 */
export const initGenerator: Generator<WebDevServerInitGeneratorSchema> = async (
  tree,
  schema,
) => {
  const defaultServeTargetName = 'serve';

  const options = {
    skipAddPlugin: false,
    skipFormat: false,
    serveTargetName: defaultServeTargetName,
    ...schema,
  } satisfies WebDevServerInitGeneratorOptions;

  // make sure `serveTargetName` is not an empty string
  if (options.serveTargetName === '') {
    options.serveTargetName = defaultServeTargetName;
  }

  const { skipAddPlugin, skipFormat } = options;

  // 1.
  if (!skipAddPlugin) {
    const nxJson = readNxJson(tree);
    nxJson.plugins ??= [];

    const hasWebDevServerPlugin = nxJson.plugins.some((pluginConfig) => {
      // `pluginConfig` can be a string representing the plugin name or a object with a plugin property representing the plugin name
      if (typeof pluginConfig === 'string') {
        return pluginConfig === WEB_DEV_SERVER_PLUGIN_NAME;
      }

      return pluginConfig.plugin === WEB_DEV_SERVER_PLUGIN_NAME;
    });

    if (!hasWebDevServerPlugin) {
      nxJson.plugins.push(
        createWebDevServerPluginConfiguration({
          webDevServerPluginName: WEB_DEV_SERVER_PLUGIN_NAME,
          options,
        }),
      );
      updateNxJson(tree, nxJson);
    }
  }

  // 2.
  if (!skipFormat) {
    await formatFiles(tree);
  }
};

export default initGenerator;

export const createWebDevServerPluginConfiguration = ({
  options,
  webDevServerPluginName,
}: {
  options: WebDevServerInitGeneratorOptions;
  webDevServerPluginName: string;
}) =>
  ({
    plugin: webDevServerPluginName,
    options: {
      serveTargetName: options.serveTargetName,
    },
  }) satisfies ExpandedPluginConfiguration<WebDevServerInitGeneratorSchema>;
