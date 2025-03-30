import {
  type ExpandedPluginConfiguration,
  type Generator,
  formatFiles,
  readNxJson,
  updateNxJson,
} from '@nx/devkit';
import { DEFAULT_WEB_TEST_RUNNER_TARGET_NAME } from '../plugins/web-test-runner.plugin';
import { WebTestRunnerInitGeneratorOptions } from './web-test-runner-init.generator.schema';

const WEB_TEST_RUNNER_PLUGIN_PATH =
  '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner';

/**
 * Adds the `@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner`
 * plugin to the `nx.json` file.
 */
export const webTestRunnerInitGenerator: Generator<
  WebTestRunnerInitGeneratorOptions
> = async (tree, userOptions) => {
  const options = normalizeWebTestRunnerInitGeneratorOptions(userOptions);

  const { skipAddPlugin, skipFormat } = options;

  if (skipAddPlugin) {
    return;
  }

  const nxJson = readNxJson(tree) ?? {};
  nxJson.plugins ??= [];

  const hasWebTestRunnerPlugin = nxJson.plugins.some((pluginConfig) => {
    /**
     * `pluginConfig` can be a string representing the plugin name or an object
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
    } satisfies ExpandedPluginConfiguration<WebTestRunnerInitGeneratorOptions>);

    updateNxJson(tree, nxJson);
  }

  if (!skipFormat) {
    await formatFiles(tree);
  }
};

export default webTestRunnerInitGenerator;

function normalizeWebTestRunnerInitGeneratorOptions(
  userOptions?: WebTestRunnerInitGeneratorOptions,
) {
  const normalizedOptions = {
    skipAddPlugin: false,
    skipFormat: false,
    testTargetName: DEFAULT_WEB_TEST_RUNNER_TARGET_NAME,
    ...userOptions,
  } satisfies WebTestRunnerInitGeneratorOptions;

  /** Make sure `testTargetName` is not an empty string. */
  if (normalizedOptions.testTargetName === '') {
    normalizedOptions.testTargetName = DEFAULT_WEB_TEST_RUNNER_TARGET_NAME;
  }

  return normalizedOptions;
}
