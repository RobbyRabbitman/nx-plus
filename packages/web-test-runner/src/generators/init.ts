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
  testTarget?: string;
  skipAddPlugin?: boolean;
  skipFormat?: boolean;
}

export const initGenerator: Generator<
  WebTestRunnerInitGeneratorSchema
> = async (tree, schema) => {
  if (!schema?.skipAddPlugin) {
    const nxJson = readNxJson(tree);
    nxJson.plugins ??= [];

    const hasPlugin = nxJson.plugins.some((pluginConfig) =>
      typeof pluginConfig === 'string'
        ? pluginConfig === webTestRunnerPluginPath
        : pluginConfig.plugin === webTestRunnerPluginPath,
    );

    if (!hasPlugin) {
      nxJson.plugins.push(webTestRunnerPluginConfiguration(schema));
      updateNxJson(tree, nxJson);
    }
  }

  if (!schema?.skipFormat) {
    await formatFiles(tree);
  }
};

export default initGenerator;

const webTestRunnerPluginConfiguration = (
  schema?: WebTestRunnerInitGeneratorSchema,
) =>
  ({
    plugin: webTestRunnerPluginPath,
    options: {
      targetName: schema?.testTarget ?? 'test',
    },
  }) as ExpandedPluginConfiguration;
