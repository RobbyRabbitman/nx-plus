import { logger, workspaceRoot } from '@nx/devkit';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  SONAR_SCAN_PROJECT_TECHNOLOGIES,
  sonarScan,
  type SonarScanProjectTechnology,
} from './sonar-scan.js';

await sonarScanCli();

/** A cli for {@link sonarScan}. */
export async function sonarScanCli() {
  try {
    const options = await yargs(hideBin(process.argv))
      .strict()
      .option('projectName', {
        type: 'string',
        demandOption: true,
      })
      .option('projectTechnology', {
        type: 'string',
        array: true,
        choices: SONAR_SCAN_PROJECT_TECHNOLOGIES,
        description: 'The technology of the project to scan.',
      })
      .option('option', {
        type: 'string',
        array: true,
        description:
          'e.g. --option sonar.token=my-token - see https://docs.sonarsource.com/sonarqube/latest/analyzing-source-code/analysis-parameters/',
      })
      .parseAsync();

    const normalizedOptions = {
      workspaceRoot,
      projectName: options.projectName,
      projectTechnologies: (options.projectTechnology ?? []).flatMap(
        (projectTechnology) => projectTechnology.split(','),
      ) as SonarScanProjectTechnology[],
      properties: Object.fromEntries(
        (options.option ?? []).map((option) => option.split('=')),
      ),
    };

    logger.verbose('[sonarScanCli] options', options);
    logger.verbose('[sonarScanCli] normalizedOptions', normalizedOptions);

    await sonarScan(normalizedOptions);

    process.exit(0);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}
