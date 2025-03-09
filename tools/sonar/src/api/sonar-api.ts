/**
 * TODO: Is there a open api definition for sonarcloud? If so, use it to
 * generate the api client.
 */

const SONAR_CLOUD_API = 'https://sonarcloud.io';

const sonarAuthHeader = (token?: string) => ({
  Authorization: `Bearer ${token ?? process.env.NX_PLUS_TOOLS_SONAR_TOKEN}`,
});

const sonarHost = (host?: string) =>
  host ?? process.env.NX_PLUS_TOOLS_SONAR_HOST ?? SONAR_CLOUD_API;

export const sonarApi = {
  projects: {
    /** https://sonarcloud.io/web_api/api/projects/create?deprecated=false&section=params */
    create: async (options: {
      token?: string;
      host?: string;
      params: {
        name: string;
        project: string;
        visibility: 'public' | 'private';
        organization: string;
        newCodeDefinitionType?:
          | 'previous_version'
          | 'days'
          | 'date'
          | 'version';
        newCodeDefinitionValue?: string;
      };
    }) => {
      const response = await fetch(
        `${sonarHost(options.host)}/api/projects/create?${new URLSearchParams(options.params)}`,
        {
          method: 'POST',
          headers: {
            ...sonarAuthHeader(options.token),
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create project: ${response.statusText} - ${await response.text()}`,
        );
      }

      const data = (await response.json()) as Promise<{
        project: {
          key: string;
          name: string;
          qualifier: string;
        };
      }>;

      return data;
    },
    /** https://sonarcloud.io/web_api/api/projects/search?deprecated=false&section=params */
    search: async (options: {
      token?: string;
      host?: string;
      params: {
        projects: string[];
        organization: string;
      };
    }) => {
      const response = await fetch(
        `${sonarHost(options.host)}/api/projects/search?${new URLSearchParams(options.params)}`,
        {
          method: 'GET',
          headers: {
            ...sonarAuthHeader(options.token),
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to search projects: ${response.statusText} - ${await response.text()}`,
        );
      }

      const data = (await response.json()) as Promise<{
        paging: {
          pageIndex: number;
          pageSize: number;
          total: number;
        };
        components: {
          organization: string;
          key: string;
          name: string;
          qualifier: string;
          visibility: string;
          lastAnalysisDate: string;
          revision: string;
        }[];
      }>;

      return data;
    },
  },
  project_branches: {
    /** https://sonarcloud.io/web_api/api/project_branches/rename?deprecated=false&section=params */
    rename: async (options: {
      token?: string;
      host?: string;
      params: { name: string; project: string };
    }) => {
      const response = await fetch(
        `${sonarHost(options.host)}/api/project_branches/rename?${new URLSearchParams(options.params)}`,
        {
          method: 'POST',
          headers: {
            ...sonarAuthHeader(options.token),
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to rename project branch: ${response.statusText} - ${await response.text()}`,
        );
      }
    },
  },
};
