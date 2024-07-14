import {
  ExpandedPluginConfiguration,
  Generator,
  formatFiles,
  readNxJson,
  updateNxJson,
} from '@nx/devkit';

export const webDevServerPluginPath =
  '@robby-rabbitman/nx-plus-web-dev-server/plugin';

export interface WebDevServerInitGeneratorSchema {
  targetName?: string;
  skipAddPlugin?: boolean;
  skipFormat?: boolean;
}

export const defaultOptions = {
  skipAddPlugin: false,
  skipFormat: false,
  targetName: 'serve',
} satisfies Required<WebDevServerInitGeneratorSchema>;

export const initGenerator: Generator<WebDevServerInitGeneratorSchema> = async (
  tree,
  schema,
) => {
  const { skipAddPlugin, skipFormat, targetName } = {
    ...defaultOptions,
    ...schema,
  } satisfies Required<WebDevServerInitGeneratorSchema>;

  if (!skipAddPlugin) {
    const nxJson = readNxJson(tree);
    nxJson.plugins ??= [];

    const hasPlugin = nxJson.plugins.some((pluginConfig) =>
      typeof pluginConfig === 'string'
        ? pluginConfig === webDevServerPluginPath
        : pluginConfig.plugin === webDevServerPluginPath,
    );

    if (!hasPlugin) {
      nxJson.plugins.push(webDevServerPluginConfiguration(targetName));
      updateNxJson(tree, nxJson);
    }
  }

  if (!skipFormat) {
    await formatFiles(tree);
  }
};

export default initGenerator;

const webDevServerPluginConfiguration = (targetName: string) =>
  ({
    plugin: webDevServerPluginPath,
    options: {
      targetName,
    },
  }) satisfies ExpandedPluginConfiguration<WebDevServerInitGeneratorSchema>;
