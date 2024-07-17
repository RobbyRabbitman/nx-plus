import {
  ExpandedPluginConfiguration,
  Generator,
  formatFiles,
  readNxJson,
  updateNxJson,
} from '@nx/devkit';

// TODO: import the package.json and read the name? :D
export const WEB_TEST_RUNNER_PLUGIN_PATH =
  '@robby-rabbitman/nx-plus-web-test-runner/plugin';

// TODO: can this type be generated from the schema.json or the json imported and then inferred in order to be synced?
export interface WebTestRunnerInitGeneratorSchema {
  /**
   * The name of the `web-test-runner` test target e.g. 'test' or
   * 'web-test-runner'.
   */
  testTargetName?: string;

  /** Whether to skip adding the plugin. */
  skipAddPlugin?: boolean;

  /** Whether to skip formatting the updated files. */
  skipFormat?: boolean;
}

export type WebTestRunnerInitGeneratorOptions =
  Required<WebTestRunnerInitGeneratorSchema>;

export const initGenerator: Generator<
  WebTestRunnerInitGeneratorSchema
> = async (tree, schema) => {
  const defaultTestTargetName = 'test';

  const options = {
    skipAddPlugin: false,
    skipFormat: false,
    testTargetName: defaultTestTargetName,
    ...schema,
  } satisfies WebTestRunnerInitGeneratorOptions;

  // make sure `testTargetName` is not an empty string
  if (options.testTargetName === '') {
    options.testTargetName = defaultTestTargetName;
  }

  const { skipAddPlugin, skipFormat } = options;

  // 1.
  if (!skipAddPlugin) {
    const nxJson = readNxJson(tree);
    nxJson.plugins ??= [];

    const hasWebTestRunnerPlugin = nxJson.plugins.some((pluginConfig) => {
      // `pluginConfig` can be a string representing the plugin name or a object with a plugin property representing the plugin name
      if (typeof pluginConfig === 'string') {
        return pluginConfig === WEB_TEST_RUNNER_PLUGIN_PATH;
      }

      return pluginConfig.plugin === WEB_TEST_RUNNER_PLUGIN_PATH;
    });

    if (!hasWebTestRunnerPlugin) {
      nxJson.plugins.push(
        createWebTestRunnerPluginConfiguration({
          webTestRunnerPluginName: WEB_TEST_RUNNER_PLUGIN_PATH,
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

export const createWebTestRunnerPluginConfiguration = ({
  options,
  webTestRunnerPluginName,
}: {
  options: WebTestRunnerInitGeneratorOptions;
  webTestRunnerPluginName: string;
}) =>
  ({
    plugin: webTestRunnerPluginName,
    options: {
      testTargetName: options.testTargetName,
    },
  }) satisfies ExpandedPluginConfiguration<WebTestRunnerInitGeneratorSchema>;
