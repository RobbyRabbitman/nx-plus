import {
  logger,
  readCachedProjectGraph,
  workspaceRoot,
  type ProjectConfiguration,
} from '@nx/devkit';
import { existsSync } from 'fs';
import { join } from 'path';
import { scan } from 'sonarqube-scanner';
import { sonarApi } from '../api/sonar-api.js';

export const SONAR_SCAN_PROJECT_TECHNOLOGIES = ['js'] as const;

export async function sonarScan(options: SonarScanOptions) {
  const { projectTechnologies, userProperties, baseProperties, project } =
    normalizeSonarScanOptions(options);

  const technologyProperties = await buildTechnologySonarProperties({
    projectTechnologies,
    project,
  });

  /** Priority: base properties < technology properties < user properties. */
  const properties = {
    ...baseProperties,
    ...technologyProperties,
    ...userProperties,
  } satisfies SonarProperties;

  await prepareScan({
    projectName: project.name,
    sonarProperties: properties,
  });

  logger.verbose(
    '[sonarScan] invoking a sonar scan with properties:',
    properties,
  );

  return scan({
    options: properties,
  });
}

/**
 * Creates a project, sets the main branch and new code definition to
 * `previous_version` before the first scan - is a no-op if the project already
 * exists.
 *
 * TODO: remove me when there is a `sonar.*` property to set the main branch
 * upon project creation on the first scan
 */
async function prepareScan(options: {
  projectName: string;
  sonarProperties: {
    'sonar.token': string;
    'sonar.organization': string;
    'sonar.projectKey': string;
  };
}) {
  const { projectName, sonarProperties } = options;

  const projectKey = sonarProperties['sonar.projectKey'];
  const organization = sonarProperties['sonar.organization'];
  const token = sonarProperties['sonar.token'];

  const sonarProjects = await sonarApi.projects.search({
    token,
    params: {
      organization,
      projects: [projectKey],
    },
  });

  if (sonarProjects.paging.total > 0) {
    logger.verbose(
      `[sonarScan] Project with key '${projectKey}' already exists - skipping project creation.`,
    );
    return;
  }

  await sonarApi.projects.create({
    token,
    params: {
      name: projectName,
      project: projectKey,
      visibility: 'public',
      newCodeDefinitionType: 'previous_version',
      newCodeDefinitionValue: 'previous_version',
      organization,
    },
  });

  await sonarApi.project_branches.rename({
    token,
    params: {
      project: projectKey,
      name: 'main',
    },
  });
}

type SonarProperties = Record<string, string>;

type SonarScanProjectTechnology =
  (typeof SONAR_SCAN_PROJECT_TECHNOLOGIES)[number];

interface SonarScanOptions {
  /** The name of the project to scan. */
  projectName: string;

  /**
   * `sonar.*` properties to pass to the sonar scan. They take precedence over
   * {@link SonarScanOptions.projectTechnologies projectTechnologies}
   */
  properties?: SonarProperties;

  /**
   * Adds technology specific properties to the sonar scan options.
   *
   * - {@link buildJsSonarProperties js}
   */
  projectTechnologies?: SonarScanProjectTechnology[];
}

function normalizeSonarScanOptions(options: SonarScanOptions) {
  const {
    projectName,
    projectTechnologies,
    properties: userProperties,
  } = {
    projectTechnologies: [],
    ...options,
  };

  logger.verbose('[sonarScan] options', options);

  const project = readCachedProjectGraph().nodes[projectName]?.data;

  if (!project) {
    throw new Error(
      `[sonarScan] No project found with the name '${projectName}'.`,
    );
  }

  const organization = userProperties?.['sonar.organization'];
  if (!organization) {
    throw new Error(
      `[sonarScan] No 'sonar.organization' property found in the sonar properties.`,
    );
  }

  const token = userProperties?.['sonar.token'];
  if (!token) {
    throw new Error(
      `[sonarScan] No 'sonar.token' property found in the sonar properties.`,
    );
  }

  const projectRoot = join(workspaceRoot, project.root);

  const baseProperties = {
    'sonar.scm.provider': 'git',
    'sonar.projectBaseDir': projectRoot,
    'sonar.organization': organization,
    'sonar.projectKey': `${organization}--${projectName.replaceAll('@', '').replaceAll('/', '--')}`,
    'sonar.token': token,
    'sonar.sourceEncoding': 'UTF-8',
    'sonar.log.level': 'INFO',
    'sonar.verbose':
      process.env.NX_VERBOSE_LOGGING === 'true' ? 'true' : 'false',
  } satisfies SonarProperties;

  return {
    project: {
      name: projectName,
      ...project,
    },
    projectTechnologies,
    userProperties,
    baseProperties,
  };
}

async function buildTechnologySonarProperties(options: {
  projectTechnologies: SonarScanProjectTechnology[];
  project: ProjectConfiguration;
}) {
  const { projectTechnologies } = options;

  const technologyBuildersForSonarProperties: Record<
    SonarScanProjectTechnology,
    () => Promise<SonarProperties>
  > = {
    js: () => buildJsSonarProperties(),
  };

  const technologyProperties = await Promise.all(
    Array.from(new Set(projectTechnologies)).map((technology) =>
      technologyBuildersForSonarProperties[technology](),
    ),
  );

  return technologyProperties.reduce(
    (all, technologyProperties) => ({ ...all, ...technologyProperties }),
    {},
  );
}

/**
 * Builds sonar properties for a js project.
 *
 * Requires the following files to be present:
 *
 * - `src` The directory containing the source **and** test files to scan
 * - `tsconfig.json` The TypeScript configuration file for the project
 * - `coverage/lcov.info` The lcov coverage report file of the tests.
 *
 * Optionally the following files can be present:
 *
 * - `coverage/execution-report.xml` The execution report file.
 */
async function buildJsSonarProperties() {
  const sourceDirectory = 'src';

  const coverageDirectory = 'coverage';

  const jsFileExtensions = [
    'js',
    'jsx',
    'mjs',
    'cjs',
    'ts',
    'tsx',
    'mts',
    'cts',
  ];

  const testFilePattern = jsFileExtensions
    .map((jsFileExtension) => `${sourceDirectory}/**/*.spec.${jsFileExtension}`)
    .join(',');

  /**
   * For the js sonar properties we need to make sure we set the initial scope
   * and define the `source` and `test` file sets, because per convention test
   * files are located in the same directory as the source files:
   *
   * 1. We need to exclude the test files from the source file set
   * 2. We need to include the test files to the test file set so that any non test
   *    file is excluded
   * 3. We need to exclude the test files from the coverage
   *
   * https://docs.sonarsource.com/sonar/latest/project-administration/analysis-scope/#file-exclusion-and-inclusion
   */
  const jsSonarProperties: SonarProperties = {
    /**
     * - Some sonar properties ONLY allow relative paths
     *   https://docs.sonarsource.com/sonar/latest/project-administration/analysis-scope
     * - Only _simple_ wild cards are supported
     *   https://docs.sonarsource.com/sonar/latest/project-administration/analysis-scope/#wildcard-patterns
     */
    'sonar.sources': sourceDirectory,
    'sonar.tests': sourceDirectory,
    'sonar.exclusions': testFilePattern,
    'sonar.test.inclusions': testFilePattern,
    'sonar.typescript.tsconfigPath': 'tsconfig.json',
    'sonar.coverage.exclusions': testFilePattern,
    'sonar.javascript.lcov.reportPaths': join(coverageDirectory, 'lcov.info'),
  };

  const executionReportPath = join(coverageDirectory, 'execution-report.xml');

  /** Not every js project has a test execution report */
  if (existsSync(executionReportPath)) {
    jsSonarProperties['sonar.testExecutionReportPaths'] = executionReportPath;
  }

  return jsSonarProperties;
}
