import {
  type ExpandedPluginConfiguration,
  type Generator,
  formatFiles,
  readNxJson,
  updateNxJson,
} from '@nx/devkit';
import { DEFAULT_WEB_TEST_RUNNER_TARGET_NAME } from '../plugins/web-test-runner.plugin.js';

const WEB_TEST_RUNNER_PLUGIN_PATH =
  '@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner';

/**
 * TODO: can this type be generated from the schema.json or the json imported
 * and then inferred in order to be synced?
 */
interface WebTestRunnerInitGeneratorSchema {
  /**
   * The name of the `Web Test Runner` test target e.g. 'test' or
   * 'web-test-runner'.
   */
  testTargetName?: string;

  /** Whether to skip adding the plugin. */
  skipAddPlugin?: boolean;

  /** Whether to skip formatting the updated files. */
  skipFormat?: boolean;
}

type WebTestRunnerInitGeneratorOptions =
  Required<WebTestRunnerInitGeneratorSchema>;

/**
 * Adds the `@robby-rabbitman/nx-plus-web-test-runner/plugins/web-test-runner`
 * plugin to the `nx.json` file.
 */
export const webTestRunnerInitGenerator: Generator<
  WebTestRunnerInitGeneratorSchema
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
    } satisfies ExpandedPluginConfiguration<WebTestRunnerInitGeneratorSchema>);

    updateNxJson(tree, nxJson);
  }

  if (!skipFormat) {
    await formatFiles(tree);
  }
};

export default webTestRunnerInitGenerator;

function normalizeWebTestRunnerInitGeneratorOptions(
  userOptions?: WebTestRunnerInitGeneratorSchema,
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
