import {
  NxJsonConfiguration,
  readCachedProjectGraph,
  readJsonFile,
  workspaceRoot,
} from '@nx/devkit';
import { startLocalRegistry } from '@nx/js/plugins/jest/local-registry';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { releasePublish, releaseVersion } from 'nx/release';

export const localRegistryTarget = 'tools-local-registry:serve';
export const publishTarget = 'tools-local-registry:publish';

/**
 * Publishes this workspace to a local registry.
 *
 * - No change logs written
 * - No git commits done
 * - When `projects` is empty, all projects are published
 * - When `projects` is not empty, only the specified projects are published
 */
export async function publish(options: {
  specifier: string;
  verbose: boolean;
  storage: string;
  tag: string;
  clearStorage: boolean;
  stopLocalRegistry: boolean;
  projects: string[];
  localRegistryTarget: string;
}) {
  const {
    clearStorage,
    specifier,
    stopLocalRegistry,
    storage,
    tag,
    verbose,
    projects,
    localRegistryTarget,
  } = options;

  const graph = readCachedProjectGraph();

  /** When invoked, stops the registry. */
  let stopLocalRegistryFn = (() => {}) satisfies Awaited<
    ReturnType<typeof startLocalRegistry>
  >;

  let releasedProjects: string[] = [];

  const nxJsonPath = join(workspaceRoot, 'nx.json');

  try {
    {
      stopLocalRegistryFn = await startLocalRegistry({
        localRegistryTarget,
        verbose,
        storage,
        clearStorage,
      });

      if (projects.length > 0) {
        const nxJson = JSON.parse(
          readFileSync(nxJsonPath).toString(),
        ) as NxJsonConfiguration;

        nxJson.release ??= {};
        nxJson.release.projectsRelationship = 'independent';
        writeFileSync(nxJsonPath, JSON.stringify(nxJson, null, 2));
      }

      const { projectsVersionData } = await releaseVersion({
        specifier,
        projects,
        stageChanges: false,
        gitCommit: false,
        gitTag: false,
        firstRelease: true,
        generatorOptionsOverrides: {
          skipLockFileUpdate: true,
        },
        verbose,
      });

      const publishStatus = await releasePublish({
        firstRelease: true,
        verbose,
        projects,
        tag,
      });

      releasedProjects = Object.keys(projectsVersionData);

      const publishedPackages = Object.entries(projectsVersionData).map(
        ([projectName, { newVersion }]) => {
          const project = graph.nodes[projectName];

          const packageJson = readJsonFile<{ name: string }>(
            resolve(workspaceRoot, project.data.root, 'package.json'),
          );

          return {
            name: packageJson.name,
            version: newVersion,
            tag,
          };
        },
      );

      if (stopLocalRegistry) {
        stopLocalRegistryFn();
      }

      return {
        publishStatus,
        publishedPackages,
        stopLocalRegistry: stopLocalRegistryFn,
      };
    }
  } catch (error) {
    stopLocalRegistryFn();
    throw error;
  } finally {
    // TODO: maybe don't revert changes with git, but rather save the state before and restore it

    // revert nx.json changes due to `nx release version` when `projects` are provided, since we set `projectsRelationship` to `independent`
    if (projects.length > 0) {
      execSync(`git checkout HEAD^ -- ${nxJsonPath}`);
    }

    // revert package version changes due to `nx release version`
    for (const projectName of releasedProjects) {
      const project = graph.nodes[projectName];

      const packageJsonPath = resolve(
        workspaceRoot,
        project.data.root,
        'package.json',
      );

      try {
        execSync(`git checkout HEAD^ -- ${packageJsonPath}`);
      } catch {
        // go on
      }
    }
  }
}
