import {
  type ExpandedPluginConfiguration,
  type Generator,
  formatFiles,
  readNxJson,
  updateNxJson,
} from '@nx/devkit';
import { DEFAULT_WEB_TEST_RUNNER_TARGET_NAME } from '../plugins/web-test-runner.plugin.js';

export const WEB_TEST_RUNNER_PLUGIN_PATH =
  '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner';

/**
 * TODO: can this type be generated from the schema.json or the json imported
 * and then inferred in order to be synced?
 */
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

export const webTestRunnerInitGenerator: Generator<
  WebTestRunnerInitGeneratorSchema
> = async (tree, schema) => {
  const defaultWebTestRunnerTargetName = DEFAULT_WEB_TEST_RUNNER_TARGET_NAME;

  const options = {
    skipAddPlugin: false,
    skipFormat: false,
    testTargetName: defaultWebTestRunnerTargetName,
    ...schema,
  } satisfies WebTestRunnerInitGeneratorOptions;

  /** Make sure `testTargetName` is not an empty string. */
  if (options.testTargetName === '') {
    options.testTargetName = defaultWebTestRunnerTargetName;
  }

  const { skipAddPlugin, skipFormat } = options;

  if (skipAddPlugin) {
    return;
  }

  const nxJson = readNxJson(tree) ?? {};
  nxJson.plugins ??= [];

  const hasWebTestRunnerPlugin = nxJson.plugins.some((pluginConfig) => {
    /**
     * `pluginConfig` can be a string representing the plugin name or a object
     * with a plugin property representing the plugin name. So we need to check
     * both.
     */

    if (typeof pluginConfig === 'string') {
      return pluginConfig === WEB_TEST_RUNNER_PLUGIN_PATH;
    }

    return pluginConfig.plugin === WEB_TEST_RUNNER_PLUGIN_PATH;
  });

  /** When the plugin is not already added to the `nx.json` file, add it. */
  if (!hasWebTestRunnerPlugin) {
    nxJson.plugins.push({
      plugin: WEB_TEST_RUNNER_PLUGIN_PATH,
      options: {
        testTargetName: options.testTargetName,
      },
    } satisfies ExpandedPluginConfiguration<WebTestRunnerInitGeneratorSchema>);

    updateNxJson(tree, nxJson);
  }

  if (!skipFormat) {
    await formatFiles(tree);
  }
};

export default webTestRunnerInitGenerator;
