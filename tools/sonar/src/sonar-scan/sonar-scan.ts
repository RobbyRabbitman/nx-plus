import {
  logger,
  readCachedProjectGraph,
  type ProjectConfiguration,
} from '@nx/devkit';
import { existsSync } from 'fs';
import { join } from 'path';
import { scan } from 'sonarqube-scanner';

export const SONAR_SCAN_PROJECT_TECHNOLOGIES = ['js'] as const;

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

export async function sonarScan(options: SonarScanOptions) {
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

  const baseProperties = {
    'sonar.scm.provider': 'git',
    'sonar.verbose':
      process.env.NX_VERBOSE_LOGGING === 'true' ? 'true' : 'false',
    'sonar.log.level': 'INFO',
    'sonar.projectKey': projectName,
    'sonar.sourceEncoding': 'UTF-8',
  } satisfies SonarProperties;

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

  logger.verbose(
    '[sonarScan] invoking a sonar scan with properties:',
    properties,
  );

  return scan({
    options: properties,
  });
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
