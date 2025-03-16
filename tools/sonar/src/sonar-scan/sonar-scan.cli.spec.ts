import { workspaceRoot } from '@nx/devkit';
import { hideBin } from 'yargs/helpers';
import { sonarScan } from './sonar-scan';

vi.mock('@nx/devkit');
vi.mock('yargs/helpers');
vi.mock('./sonar-scan.js', async (originalModule) => {
  const sonarScan = await originalModule<typeof import('./sonar-scan')>();

  return {
    sonarScan: vi.fn(),
    SONAR_SCAN_PROJECT_TECHNOLOGIES: sonarScan.SONAR_SCAN_PROJECT_TECHNOLOGIES,
  } satisfies typeof import('./sonar-scan');
});

describe('[Unit Test] sonarScanCli', () => {
  async function invokeSonarScanCli(args: string, expectedErrorCode: number) {
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    vi.mocked(hideBin).mockReturnValue(args.split(' '));

    await import('./sonar-scan.cli');

    expect(process.exit).toHaveBeenCalledWith(expectedErrorCode);
  }

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('should work', async () => {
    await invokeSonarScanCli('--projectName some-project', 0);

    expect(sonarScan).toHaveBeenCalledWith({
      projectName: 'some-project',
      workspaceRoot,
      projectTechnologies: [],
      properties: {},
    });
  });

  it('should require a project', async () => {
    await invokeSonarScanCli('', 1);
  });

  it('should pass project technologies', async () => {
    await invokeSonarScanCli(
      '--projectName some-project --projectTechnology js',
      0,
    );

    expect(sonarScan).toHaveBeenCalledWith({
      projectName: 'some-project',
      workspaceRoot,
      projectTechnologies: ['js'],
      properties: {},
    });
  });

  it('should pass sonar properties', async () => {
    await invokeSonarScanCli(
      '--projectName some-project --option sonar.token=my-token --option sonar.organization=my-org',
      0,
    );

    expect(sonarScan).toHaveBeenCalledWith({
      projectName: 'some-project',
      workspaceRoot,
      projectTechnologies: [],
      properties: {
        'sonar.token': 'my-token',
        'sonar.organization': 'my-org',
      },
    });
  });
});
