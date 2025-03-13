import {
  type CreateNodesFunction,
  type CreateNodesV2,
  type TargetConfiguration,
  createNodesFromFiles,
  getPackageManagerCommand,
} from '@nx/devkit';
import { SonarScanProjectTechnology } from '@robby-rabbitman/nx-plus-tools-sonar';
import sonarScanPackageJson from '@robby-rabbitman/nx-plus-tools-sonar/package.json';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

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
  const projectRoot = dirname(sonarScanConfigPath);

  const { sonarScanTargetName, sonarScanTargetConfiguration } =
    normalizeSonarScanTargetOptions(projectRoot, options);

  return {
    projects: {
      /**
       * We add the sonar scan target to the project node where the
       * `sonar-project.properties` file is in.
       *
       * NOTE: this forces the `sonar-project.properties` to be present next to
       * the `package.json` file or _the_ root of a project.
       */
      [projectRoot]: {
        targets: {
          [sonarScanTargetName]: sonarScanTargetConfiguration,
        },
      },
    },
  };
};

function normalizeSonarScanTargetOptions(
  projectRoot: string,
  options: SonarScanPluginSchema | undefined,
) {
  return {
    sonarScanTargetName: options?.sonarScanTargetName || 'sonar-scan',
    sonarScanTargetConfiguration: {
      command: SONAR_SCAN_COMMAND,
      ...options?.sonarScanTargetConfiguration,
      options: {
        projectName: '{projectName}',
        projectTechnology: inferProjectTechnologies(projectRoot).join(','),
        ...options?.sonarScanTargetConfiguration?.options,
      },
    },
  } satisfies SonarScanPluginOptions;
}

function inferProjectTechnologies(projectRoot: string) {
  const technologyIdentifiers = {
    js: () => isJsProject(projectRoot),
  } satisfies Record<SonarScanProjectTechnology, () => boolean>;

  return Object.keys(technologyIdentifiers).filter((technology) =>
    technologyIdentifiers[technology as keyof typeof technologyIdentifiers](),
  );
}

function isJsProject(projectRoot: string) {
  return existsSync(join(projectRoot, 'package.json'));
}
