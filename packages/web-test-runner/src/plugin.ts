import {
  type CreateNodes,
  type CreateNodesContextV2,
  type CreateNodesFunction,
  type CreateNodesV2,
  type TargetConfiguration,
  createNodesFromFiles,
} from '@nx/devkit';
import { type TestRunnerConfig } from '@web/test-runner';
import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { type RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl.js';

// TODO: copy pasta from '@web/test-runner/src/config/readCliArgs', remove this type if its exported from their public api
// import { TestRunnerCliArgs } from '@web/test-runner';
export interface TestRunnerCliArgs
  extends Partial<
    Pick<
      TestRunnerConfig,
      | 'files'
      | 'rootDir'
      | 'watch'
      | 'coverage'
      | 'concurrentBrowsers'
      | 'concurrency'
      | 'staticLogging'
      | 'manual'
      | 'open'
      | 'port'
      | 'preserveSymlinks'
      | 'nodeResolve'
      | 'debug'
      | 'esbuildTarget'
    >
  > {
  config?: string;
  groups?: string;
  group?: string;
  puppeteer?: boolean;
  playwright?: boolean;
  browsers?: string[];
  updateSnapshots?: boolean;
}

export type WebTestRunnerTargetConfiguration = TargetConfiguration<
  Partial<RunCommandsOptions> & TestRunnerCliArgs
>;

export interface WebTestRunnerTargetPluginSchema {
  /**
   * The name of the `web-test-runner` test target e.g. `'test'` or
   * `'web-test-runner'`.
   */
  testTargetName?: string;

  /** The configuration of the `web-test-runner` _test_ target. */
  testTargetConfig?: WebTestRunnerTargetConfiguration;
}

export type WebTestRunnerTargetPluginOptions =
  Required<WebTestRunnerTargetPluginSchema>;

export const WEB_TEST_RUNNER_CONFIG_FILE_NAME_GLOB =
  '**/@(web-test-runner|wtr).config.@(js|cjs|mjs)';

export const WEB_TEST_RUNNER_COMMAND = 'web-test-runner';

// TODO: remove me in nx20
export const createNodes: CreateNodes<WebTestRunnerTargetPluginSchema> = [
  WEB_TEST_RUNNER_CONFIG_FILE_NAME_GLOB,
  (webTestRunnerConfigPath, schema, context) =>
    createWebTestRunnerTarget(webTestRunnerConfigPath, schema, context),
];

// TODO: rename me in nx21
export const createNodesV2: CreateNodesV2<WebTestRunnerTargetPluginSchema> = [
  WEB_TEST_RUNNER_CONFIG_FILE_NAME_GLOB,
  (webTestRunnerConfigPaths, schema, context) =>
    createNodesFromFiles(
      createWebTestRunnerTarget,
      webTestRunnerConfigPaths,
      schema,
      context,
    ),
];

/**
 * Helper function for `createNodes`.
 *
 * 1. Checks whether `webTestRunnerConfigPath` is considered a non root project, if
 *    not returns without modifying the project graph.
 * 2. Adds a _test_ target, which calls the `web-test-runner` cli in the project
 *    root when executed. Merges `schema.testTargetConfig` into this target.
 *
 * @param webTestRunnerConfigPath Relative to `context.workspaceRoot` e.g
 *   `'path/to/web-test-runner.config.js'`
 * @param schema Of `createNodes`
 * @param context Of `createNodes`
 * @returns
 */
const createWebTestRunnerTarget: CreateNodesFunction<
  WebTestRunnerTargetPluginSchema | undefined
> = (webTestRunnerConfigPath, schema, context) => {
  const defaultTestTargetName = 'test';

  const options = {
    testTargetName: defaultTestTargetName,
    testTargetConfig: {},
    ...schema,
  } satisfies WebTestRunnerTargetPluginOptions;

  // make sure `testTargetName` is not an empty string
  if (options.testTargetName === '') {
    options.testTargetName = defaultTestTargetName;
  }

  const { testTargetName, testTargetConfig } = options;

  const webTestRunnerConfigFileName = basename(webTestRunnerConfigPath);
  const maybewebTestRunnerProjectRoot = dirname(webTestRunnerConfigPath);

  // 1.
  if (!isNonRootProject(maybewebTestRunnerProjectRoot, context)) {
    return {};
  }

  const webTestRunnerProjectRoot = maybewebTestRunnerProjectRoot;

  // 2.
  const webTestRunnerConfiguration = {
    config: webTestRunnerConfigFileName,
  } satisfies TestRunnerCliArgs;

  const webTestRunnerTargetConfiguration = {
    command: WEB_TEST_RUNNER_COMMAND,
    ...testTargetConfig,
    options: {
      ...webTestRunnerConfiguration,
      cwd: '{projectRoot}',
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

/**
 * Helper function for `createNodes`.
 *
 * https://nx.dev/extending-nx/recipes/project-graph-plugins#identifying-projects
 *
 * @param directory Relative to `context.workspaceRoot` e.g `'path/to/project'`
 * @returns Whether `directory` is considered a non root project => `directory`
 *   is not `context.workspaceRoot` and has a `project.json` or `package.json`
 */
const isNonRootProject = (directory: string, context: CreateNodesContextV2) => {
  if (directory === '.') return false;

  return (
    existsSync(join(context.workspaceRoot, directory, 'project.json')) ||
    existsSync(join(context.workspaceRoot, directory, 'package.json'))
  );
};
