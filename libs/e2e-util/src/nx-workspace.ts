import { logger, readCachedProjectGraph, workspaceRoot } from '@nx/devkit';
import { exec } from 'child_process';
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { coerce, major } from 'semver';
import { promisify } from 'util';

interface CreateNxWorkspaceOptions {
  /** The directory in which to execute `create-nx-workspace`. */
  cwd: string;

  /** The name of the workspace e.g. 'my-nx-workspace' */
  name: string;

  /**
   * If true, clears `{{cwd}}/{{name}}`. Note that `create-nx-workspace` fails
   * if there is a workspace already.
   */
  clear?: boolean;

  /**
   * The nx version to use, must be a valid npm version identifier =>
   * `create-nx-workspace@{nxVersion}`
   */
  version: string;

  /** Additional arguments for `create-nx-workspace`. */
  args?: string;
}

/**
 * Creates a nx workspace with `create-nx-workspace`.
 *
 * - Disables nx cloud
 *
 * @returns The workspace root of the created nx workspace.
 */
export const createNxWorkspace = async (options: CreateNxWorkspaceOptions) => {
  const { cwd, name, version, args, clear } = options;

  const workspaceRoot = join(cwd, name);

  logger.verbose(`Creating nx workspace in ${workspaceRoot}`);

  if (clear) {
    await rm(workspaceRoot, {
      recursive: true,
      force: true,
    });
  }

  // create the current working directory.
  await mkdir(cwd, {
    recursive: true,
  });

  // TODO: apparently NX_ISOLATE_PLUGINS=false must be set to false for create-nx-workspace@<=18
  const isolatePlugins = major(coerce(version)) >= 19;

  // TODO: always npx?
  const cmd = `NX_ISOLATE_PLUGINS=${isolatePlugins} npx --yes create-nx-workspace@${version} ${name} --nxCloud skip --no-interactive ${args}`;

  logger.verbose(cmd);

  await promisify(exec)(cmd, {
    cwd,
  });

  return workspaceRoot;
};

interface CreateE2eNxWorkspaceOptions
  extends Omit<CreateNxWorkspaceOptions, 'cwd'> {
  /**
   * The e2e project, for which a nx workspace should be created e.g.
   * `my-e2e-project`.
   */
  projectName: string;
}

/**
 * Creates a nx workspace in `dist/e2e-nx-workspaces/{projectRoot}/{name}` with
 * `create-nx-workspace`.
 *
 * - {projectRoot} <=> the path to the project root of the project identified by
 *   `projectName` relative to _this_ nx workspace root e.g.
 *   `path/to/e2e-project`
 *
 * @returns The workspace root of the created nx workspace.
 * @see {@link createNxWorkspace}
 */
export const createE2eNxWorkspace = async (
  options: CreateE2eNxWorkspaceOptions,
) => {
  const { projectName, version, name, args, clear } = options;

  const projectConfig = readCachedProjectGraph().nodes[projectName].data;

  const e2eWorkspacesOfProject = join(
    workspaceRoot,
    'dist',
    'e2e-nx-workspaces',
    projectConfig.root,
  );

  return createNxWorkspace({
    cwd: e2eWorkspacesOfProject,
    version,
    name,
    args,
    clear,
  });
};
