import {
  type CreateNodesFunction,
  type CreateNodesV2,
  type TargetConfiguration,
  createNodesFromFiles,
  getPackageManagerCommand,
} from '@nx/devkit';
import sonarScanPackageJson from '@robby-rabbitman/nx-plus-tools-sonar/package.json';
import { dirname } from 'path';

type SonarScanTargetConfiguration = TargetConfiguration;

export interface SonarScanPluginSchema {
  /** The name of the target to run the sonar scan e.g `sonar-scan` */
  sonarScanTargetName?: string;

  /** The configuration for the sonar scan target. */
  sonarScanTargetConfiguration?: SonarScanTargetConfiguration;
}

type SonarScanPluginOptions = Required<SonarScanPluginSchema>;

/** The glob pattern representing projects that have a sonar scan. */
const SONAR_PROJECT_PROPERTIES_GLOB = '**/sonar-project.properties';

/** The command to run the sonar scan. */
const SONAR_SCAN_COMMAND = `${getPackageManagerCommand().exec} nx run ${sonarScanPackageJson.nx.name}:${'exec-sonar-scan-cli' satisfies keyof typeof sonarScanPackageJson.nx.targets}`;

export const createNodesV2 = [
  SONAR_PROJECT_PROPERTIES_GLOB,
  (sonarScanConfigPaths, options, context) =>
    createNodesFromFiles(
      createSonarScanTarget,
      sonarScanConfigPaths,
      options,
      context,
    ),
] satisfies CreateNodesV2<SonarScanPluginSchema>;

/**
 * Adds a sonar scan target in the project node where the
 * `sonar-project.properties` file is in.
 *
 * - A custom target name can be provided by setting the `sonarScanTargetName`
 * - The target can be configured by setting the `sonarScanTargetConfiguration`
 */
const createSonarScanTarget: CreateNodesFunction<
  SonarScanPluginSchema | undefined
> = (sonarScanConfigPath, options) => {
  const { sonarScanTargetName, sonarScanTargetConfiguration } =
    normalizeSonarScanTargetOptions(options);

  const sonarScanProjectRoot = dirname(sonarScanConfigPath);

  return {
    projects: {
      /**
       * We add the sonar scan target to the project node where the
       * `sonar-project.properties` file is in.
       *
       * NOTE: this forces the `sonar-project.properties` to be present next to
       * the `package.json` file or _the_ root of a project.
       */
      [sonarScanProjectRoot]: {
        targets: {
          [sonarScanTargetName]: sonarScanTargetConfiguration,
        },
      },
    },
  };
};

function normalizeSonarScanTargetOptions(
  options: SonarScanPluginSchema | undefined,
): SonarScanPluginOptions {
  const defaultOptions = {
    sonarScanTargetName: 'sonar-scan',
    sonarScanTargetConfiguration: {
      command: SONAR_SCAN_COMMAND,
    },
  } satisfies Partial<SonarScanPluginOptions>;

  return {
    sonarScanTargetName:
      options?.sonarScanTargetName || defaultOptions.sonarScanTargetName,
    sonarScanTargetConfiguration: {
      ...defaultOptions.sonarScanTargetConfiguration,
      ...options?.sonarScanTargetConfiguration,
    },
  } satisfies SonarScanPluginOptions;
}
