import {
  type CreateNodesFunction,
  type CreateNodesV2,
  type TargetConfiguration,
  createNodesFromFiles,
} from '@nx/devkit';
import { existsSync } from 'fs';
import { basename, dirname, join } from 'path';

/**
 * The glob pattern to match `Web Test Runner` configuration files.
 *
 * https://modern-web.dev/docs/test-runner/cli-and-configuration/#configuration-file
 */
const WEB_TEST_RUNNER_CONFIG_FILE_NAME_GLOB =
  '**/@(web-test-runner|wtr).config.@(js|cjs|mjs)';

/**
 * The name of the `Web Test Runner` command.
 *
 * https://modern-web.dev/docs/test-runner/overview/#basic-commands
 */
const WEB_TEST_RUNNER_COMMAND = 'web-test-runner';

export const DEFAULT_WEB_TEST_RUNNER_TARGET_NAME = 'test';

/**
 * TODO: '@web/test-runner' does not export the `TestRunnerCliArgs` type - add
 * it when its exported from their public api.
 *
 * https://github.com/modernweb-dev/web/blob/17cfc0d70f46b321912e4506b2cccae1b16b1534/packages/test-runner/src/config/readCliArgs.ts#L7-L34
 */
type WebTestRunnerTargetConfiguration = TargetConfiguration;

interface WebTestRunnerPluginSchema {
  /**
   * The name of the `Web Test Runner` test target e.g. `'test'` or
   * `'web-test-runner'`.
   */
  testTargetName?: string;

  /**
   * The configuration of the `Web Test Runner` target identified by
   * {@link WebTestRunnerPluginSchema.testTargetName testTargetName}.
   *
   * @example
   *   {
   *     "watch": true
   *   }
   *
   * @see https://modern-web.dev/docs/test-runner/cli-and-configuration/
   */
  testTargetConfig?: WebTestRunnerTargetConfiguration;
}

type WebTestRunnerPluginOptions = Required<WebTestRunnerPluginSchema>;

export const createNodesV2 = [
  WEB_TEST_RUNNER_CONFIG_FILE_NAME_GLOB,
  (webTestRunnerConfigPaths, schema, context) =>
    createNodesFromFiles(
      createWebTestRunnerTarget,
      webTestRunnerConfigPaths,
      schema,
      context,
    ),
] satisfies CreateNodesV2<WebTestRunnerPluginSchema>;

const createWebTestRunnerTarget: CreateNodesFunction<
  WebTestRunnerPluginSchema | undefined
> = (webTestRunnerConfigPath, userOptions, context) => {
  const options = normalizeWebTestRunnerOptions(userOptions);

  const { testTargetName, testTargetConfig } = options;

  const webTestRunnerInformation = extractWebTestRunnerInformation(
    webTestRunnerConfigPath,
    context.workspaceRoot,
  );

  if (!webTestRunnerInformation.isProject) {
    return {};
  }

  /**
   * TODO: '@web/test-runner' does not export the `TestRunnerCliArgs` type - add
   * them when its exported from their public api
   *
   * https://github.com/modernweb-dev/web/blob/17cfc0d70f46b321912e4506b2cccae1b16b1534/packages/test-runner/src/config/readCliArgs.ts#L7-L34
   */
  const webTestRunnerDefaultCliArgs = {
    config: webTestRunnerInformation.configFileName,
  };

  const webTestRunnerTargetConfiguration = {
    command: WEB_TEST_RUNNER_COMMAND,
    ...testTargetConfig,
    options: {
      cwd: webTestRunnerInformation.configDir,
      ...webTestRunnerDefaultCliArgs,
      ...testTargetConfig.options,
    },
  } satisfies WebTestRunnerTargetConfiguration;

  return {
    projects: {
      [webTestRunnerInformation.configDir]: {
        targets: {
          [testTargetName]: webTestRunnerTargetConfiguration,
        },
      },
    },
  };
};

function normalizeWebTestRunnerOptions(
  userOptions?: WebTestRunnerPluginSchema,
) {
  const normalizedOptions = {
    testTargetName: DEFAULT_WEB_TEST_RUNNER_TARGET_NAME,
    testTargetConfig: {},
    ...userOptions,
  } satisfies WebTestRunnerPluginOptions;

  /** Make sure `testTargetName` is not an empty string. */
  if (normalizedOptions.testTargetName === '') {
    normalizedOptions.testTargetName = DEFAULT_WEB_TEST_RUNNER_TARGET_NAME;
  }

  return normalizedOptions;
}

function extractWebTestRunnerInformation(
  webTestRunnerConfigPath: string,
  workspaceRoot: string,
) {
  return {
    configFileName: basename(webTestRunnerConfigPath),
    configDir: dirname(webTestRunnerConfigPath),
    isProject: isProject(dirname(webTestRunnerConfigPath), workspaceRoot),
  };
}

/**
 * Returns true if the directory contains a `project.json` or `package.json`
 * file.
 */
function isProject(directory: string, workspaceRoot: string) {
  return (
    existsSync(join(workspaceRoot, directory, 'project.json')) ||
    existsSync(join(workspaceRoot, directory, 'package.json'))
  );
}
