import {
  ExpandedPluginConfiguration,
  Generator,
  formatFiles,
  readNxJson,
  updateNxJson,
} from '@nx/devkit';

export const webTestRunnerPluginPath =
  '@robby-rabbitman/nx-plus-web-test-runner/plugin';

export interface WebTestRunnerInitGeneratorSchema {
  targetName?: string;
  skipAddPlugin?: boolean;
  skipFormat?: boolean;
}

export const initGenerator: Generator<
  WebTestRunnerInitGeneratorSchema
> = async (tree, schema) => {
  const { skipAddPlugin, skipFormat, targetName } = {
    skipAddPlugin: false,
    skipFormat: false,
    targetName: 'test',
    ...schema,
  } satisfies Required<WebTestRunnerInitGeneratorSchema>;

  if (!skipAddPlugin) {
    const nxJson = readNxJson(tree);
    nxJson.plugins ??= [];

    const hasPlugin = nxJson.plugins.some((pluginConfig) =>
      typeof pluginConfig === 'string'
        ? pluginConfig === webTestRunnerPluginPath
        : pluginConfig.plugin === webTestRunnerPluginPath,
    );

    if (!hasPlugin) {
      nxJson.plugins.push(webTestRunnerPluginConfiguration(targetName));
      updateNxJson(tree, nxJson);
    }
  }

  if (!skipFormat) {
    await formatFiles(tree);
  }
};

export default initGenerator;

const webTestRunnerPluginConfiguration = (targetName: string) =>
  ({
    plugin: webTestRunnerPluginPath,
    options: {
      targetName,
    },
  }) as ExpandedPluginConfiguration;
