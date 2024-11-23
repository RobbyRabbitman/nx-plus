import {
  type CreateNodesFunction,
  type CreateNodesV2,
  type TargetConfiguration,
  createNodesFromFiles,
} from '@nx/devkit';
import { existsSync } from 'fs';
import { basename, dirname, join } from 'path';

export const WEB_TEST_RUNNER_CONFIG_FILE_NAME_GLOB =
  '**/@(web-test-runner|wtr).config.@(js|cjs|mjs)';

export const WEB_TEST_RUNNER_COMMAND = 'web-test-runner';

/**
 * TODO: '@web/test-runner' does not export the `TestRunnerCliArgs` type - add
 * it when its exported from their public api.
 *
 * https://github.com/modernweb-dev/web/blob/17cfc0d70f46b321912e4506b2cccae1b16b1534/packages/test-runner/src/config/readCliArgs.ts#L7-L34
 */
export type WebTestRunnerTargetConfiguration = TargetConfiguration;

export interface WebTestRunnerPluginSchema {
  /**
   * The name of the `web-test-runner` test target e.g. `'test'` or
   * `'web-test-runner'`.
   */
  testTargetName?: string;

  /**
   * The configuration of the `web-test-runner` target identified by
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

export type WebTestRunnerPluginOptions = Required<WebTestRunnerPluginSchema>;

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

export const DEFAULT_WEB_TEST_RUNNER_TARGET_NAME = 'test';

const createWebTestRunnerTarget: CreateNodesFunction<
  WebTestRunnerPluginSchema | undefined
> = (webTestRunnerConfigPath, schema, context) => {
  const defaultWebTestRunnerTargetName = DEFAULT_WEB_TEST_RUNNER_TARGET_NAME;

  const options = {
    testTargetName: defaultWebTestRunnerTargetName,
    testTargetConfig: {},
    ...schema,
  } satisfies WebTestRunnerPluginOptions;

  /** Make sure `testTargetName` is not an empty string. */
  if (options.testTargetName === '') {
    options.testTargetName = defaultWebTestRunnerTargetName;
  }

  const { testTargetName, testTargetConfig } = options;

  const webTestRunnerConfigFileName = basename(webTestRunnerConfigPath);

  const maybeWebTestRunnerProjectRoot = dirname(webTestRunnerConfigPath);

  if (!isProject(maybeWebTestRunnerProjectRoot, context.workspaceRoot)) {
    return {};
  }

  const webTestRunnerProjectRoot = maybeWebTestRunnerProjectRoot;

  /**
   * TODO: '@web/test-runner' does not export the `TestRunnerCliArgs` type - add
   * them when its exported from their public api
   *
   * https://github.com/modernweb-dev/web/blob/17cfc0d70f46b321912e4506b2cccae1b16b1534/packages/test-runner/src/config/readCliArgs.ts#L7-L34
   */
  const webTestRunnerCliArgs = {
    config: webTestRunnerConfigFileName,
  };

  const webTestRunnerTargetConfiguration = {
    command: WEB_TEST_RUNNER_COMMAND,
    ...testTargetConfig,
    options: {
      /** Make sure to run `web-test-runner` in the project root directory. */
      cwd: '{projectRoot}',
      ...webTestRunnerCliArgs,
      ...testTargetConfig.options,
    },
  } satisfies WebTestRunnerTargetConfiguration;

  return {
    projects: {
      [webTestRunnerProjectRoot]: {
        targets: {
          [testTargetName]: webTestRunnerTargetConfiguration,
        },
      },
    },
  };
};

const isProject = (directory: string, workspaceRoot: string) => {
  return (
    existsSync(join(workspaceRoot, directory, 'project.json')) ||
    existsSync(join(workspaceRoot, directory, 'package.json'))
  );
};
