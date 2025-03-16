import { readCachedProjectGraph, workspaceRoot } from '@nx/devkit';
import { existsSync } from 'fs';
import { join } from 'path';
import { scan } from 'sonarqube-scanner';
import { sonarApi } from '../api/sonar-api';
import { sonarScan } from './sonar-scan';

vi.mock('@nx/devkit');
vi.mock('sonarqube-scanner');
vi.mock('fs');

describe('[Unit Test] sonarScan', () => {
  function stubProjectGraph() {
    vi.mocked(readCachedProjectGraph).mockReturnValue({
      dependencies: {},
      nodes: {
        'some-project': {
          data: {
            root: 'some/project',
          },
          name: 'some-project',
          type: 'app',
        },
      },
    });
  }

  function stubSonarApi(responses?: {
    search?: Awaited<ReturnType<typeof sonarApi.projects.search>>;
    create?: Awaited<ReturnType<typeof sonarApi.projects.create>>;
    rename?: Awaited<ReturnType<typeof sonarApi.project_branches.rename>>;
  }) {
    vi.spyOn(sonarApi.projects, 'search').mockResolvedValue(
      responses?.search ?? {
        paging: {
          total: 0,
          pageIndex: 0,
          pageSize: 10,
        },
        components: [],
      },
    );

    vi.spyOn(sonarApi.projects, 'create').mockResolvedValue(
      responses?.create ?? {
        project: {
          key: 'some-project',
          name: 'some-project',
          qualifier: 'TRK',
        },
      },
    );

    vi.spyOn(sonarApi.project_branches, 'rename').mockResolvedValue();
  }

  function stubHasExecutionReport(value?: boolean) {
    vi.mocked(existsSync).mockReturnValue(value ?? false);
  }

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    stubProjectGraph();
    stubSonarApi();
    stubHasExecutionReport();
  });

  it('should throw if the provided project does not exist', async () => {
    await expect(
      sonarScan({
        projectName: 'non-existent-project',
      }),
    ).rejects.toThrowError(
      "[sonarScan] No project found with the name 'non-existent-project'.",
    );
  });

  it('should throw if no organization is provided', async () => {
    await expect(
      sonarScan({
        projectName: 'some-project',
      }),
    ).rejects.toThrowError(
      "No 'sonar.organization' property found in the sonar properties.",
    );
  });

  it('should throw if no token is provided', async () => {
    await expect(
      sonarScan({
        projectName: 'some-project',
        properties: {
          'sonar.organization': 'my-org',
        },
      }),
    ).rejects.toThrowError(
      "No 'sonar.token' property found in the sonar properties.",
    );
  });

  it('should have base properties', async () => {
    await sonarScan({
      projectName: 'some-project',
      properties: {
        'sonar.organization': 'my-org',
        'sonar.token': 'my-token',
      },
    });

    expect(scan).toHaveBeenCalledWith({
      options: {
        'sonar.token': 'my-token',
        'sonar.host.url': 'https://sonarcloud.io',
        'sonar.log.level': 'INFO',
        'sonar.organization': 'my-org',
        'sonar.projectBaseDir': join(workspaceRoot, 'some/project'),
        'sonar.projectKey': 'my-org--some-project',
        'sonar.scm.provider': 'git',
        'sonar.sourceEncoding': 'UTF-8',
        'sonar.verbose': 'false',
      },
    });
  });

  describe('technology sonar properties', () => {
    describe('js', () => {
      it('default', async () => {
        await sonarScan({
          projectName: 'some-project',
          properties: {
            'sonar.organization': 'my-org',
            'sonar.token': 'my-token',
          },
          projectTechnologies: ['js'],
        });

        expect(scan).toHaveBeenCalledWith({
          options: {
            /** Base properties */
            'sonar.token': 'my-token',
            'sonar.host.url': 'https://sonarcloud.io',
            'sonar.log.level': 'INFO',
            'sonar.organization': 'my-org',
            'sonar.projectBaseDir': join(workspaceRoot, 'some/project'),
            'sonar.projectKey': 'my-org--some-project',
            'sonar.scm.provider': 'git',
            'sonar.sourceEncoding': 'UTF-8',
            'sonar.verbose': 'false',

            /** Js properties */
            'sonar.sources': 'src',
            'sonar.tests': 'src',
            'sonar.exclusions':
              'src/**/*.spec.js,src/**/*.spec.jsx,src/**/*.spec.mjs,src/**/*.spec.cjs,src/**/*.spec.ts,src/**/*.spec.tsx,src/**/*.spec.mts,src/**/*.spec.cts',
            'sonar.test.inclusions':
              'src/**/*.spec.js,src/**/*.spec.jsx,src/**/*.spec.mjs,src/**/*.spec.cjs,src/**/*.spec.ts,src/**/*.spec.tsx,src/**/*.spec.mts,src/**/*.spec.cts',
            'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',
            'sonar.coverage.exclusions':
              'src/**/*.spec.js,src/**/*.spec.jsx,src/**/*.spec.mjs,src/**/*.spec.cjs,src/**/*.spec.ts,src/**/*.spec.tsx,src/**/*.spec.mts,src/**/*.spec.cts',
            'sonar.typescript.tsconfigPath': 'tsconfig.json',
          },
        });
      });

      it('with execution report', async () => {
        stubHasExecutionReport(true);

        await sonarScan({
          projectName: 'some-project',
          properties: {
            'sonar.organization': 'my-org',
            'sonar.token': 'my-token',
          },
          projectTechnologies: ['js'],
        });

        expect(scan).toHaveBeenCalledWith({
          options: {
            /** Base properties */
            'sonar.token': 'my-token',
            'sonar.host.url': 'https://sonarcloud.io',
            'sonar.log.level': 'INFO',
            'sonar.organization': 'my-org',
            'sonar.projectBaseDir': join(workspaceRoot, 'some/project'),
            'sonar.projectKey': 'my-org--some-project',
            'sonar.scm.provider': 'git',
            'sonar.sourceEncoding': 'UTF-8',
            'sonar.verbose': 'false',

            /** Js properties */
            'sonar.sources': 'src',
            'sonar.tests': 'src',
            'sonar.exclusions':
              'src/**/*.spec.js,src/**/*.spec.jsx,src/**/*.spec.mjs,src/**/*.spec.cjs,src/**/*.spec.ts,src/**/*.spec.tsx,src/**/*.spec.mts,src/**/*.spec.cts',
            'sonar.test.inclusions':
              'src/**/*.spec.js,src/**/*.spec.jsx,src/**/*.spec.mjs,src/**/*.spec.cjs,src/**/*.spec.ts,src/**/*.spec.tsx,src/**/*.spec.mts,src/**/*.spec.cts',
            'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',
            'sonar.coverage.exclusions':
              'src/**/*.spec.js,src/**/*.spec.jsx,src/**/*.spec.mjs,src/**/*.spec.cjs,src/**/*.spec.ts,src/**/*.spec.tsx,src/**/*.spec.mts,src/**/*.spec.cts',
            'sonar.typescript.tsconfigPath': 'tsconfig.json',

            'sonar.testExecutionReportPaths': 'coverage/execution-report.xml',
          },
        });
      });
    });
  });

  describe('preparing', () => {
    it('should not create the project if it exists already', async () => {
      stubSonarApi({
        search: {
          paging: {
            total: 1,
            pageIndex: 1,
            pageSize: 10,
          },
          components: [
            {
              key: 'some-project',
              name: 'some-project',
              qualifier: 'TRK',
              lastAnalysisDate: '2021-09-01T00:00:00+0000',
              organization: 'my-org',
              revision: '123456',
              visibility: 'public',
            },
          ],
        },
      });

      await sonarScan({
        projectName: 'some-project',
        properties: {
          'sonar.organization': 'my-org',
          'sonar.token': 'my-token',
        },
      });

      expect(sonarApi.projects.create).not.toHaveBeenCalled();
    });

    it("should create a project if it doesn't exist", async () => {
      await sonarScan({
        projectName: 'some-project',
        properties: {
          'sonar.organization': 'my-org',
          'sonar.token': 'my-token',
        },
      });

      expect(sonarApi.projects.create).toHaveBeenCalledWith({
        params: {
          name: 'some-project',
          organization: 'my-org',
          project: 'my-org--some-project',
          visibility: 'public',
          newCodeDefinitionType: 'previous_version',
          newCodeDefinitionValue: 'previous_version',
        },
        token: 'my-token',
      });

      expect(sonarApi.project_branches.rename).toHaveBeenCalledWith({
        params: {
          name: 'main',
          project: 'my-org--some-project',
        },
        token: 'my-token',
      });
    });
  });
});
