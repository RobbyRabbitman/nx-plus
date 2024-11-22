import { logger, readCachedProjectGraph, workspaceRoot } from '@nx/devkit';
import { VERDACCIO_URL } from '@robby-rabbitman/nx-plus-tools-verdaccio';
import { spawnSync } from 'child_process';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import nodeE2eUtilPackageJson from '../../package.json';

type CreateE2eNxWorkspaceOptions = Partial<
  Omit<CreateNxWorkspaceOptions, 'cwd'>
>;

/**
 * Creates a nx workspace in `{projectRoot}/e2e-nx-workspaces/{name}` with
 * `create-nx-workspace`.
 *
 * By default:
 *
 * - Cleans the to be created nx workspace directory if it exists
 * - Disables nx cloud
 * - Uses the nx version of this workspace
 *
 * @returns The workspace root of the created nx workspace.
 */
export const createE2eNxWorkspace = async (
  options?: CreateE2eNxWorkspaceOptions,
) => {
  const projectName = process.env.NX_TASK_TARGET_PROJECT;

  if (!projectName) {
    throw new Error(
      '[createE2eNxWorkspace] Missing required environment variable NX_TASK_TARGET_PROJECT - are you a nx task?',
    );
  }

  const defaultOptions = {
    clean: true,
    name: `${projectName}---${Date.now()}`,
    /**
     * Its fine that we import `@nx/devkit` here from this package, because:
     *
     * - This workspace has a single version policy for all its packages.
     * - `@nx/*` packages share the same version => `nx` === `@nx/devkit`
     * - The e2e tests cover the current major version of `nx` - it must not
     *   matter what minor or patch version we are using.
     */
    version: nodeE2eUtilPackageJson.dependencies['@nx/devkit'],
  } satisfies CreateE2eNxWorkspaceOptions;

  const combinedOptions = {
    ...defaultOptions,
    ...options,
  };

  logger.verbose(`[createE2eNxWorkspace] default options`, defaultOptions);
  logger.verbose(`[createE2eNxWorkspace] options`, options);
  logger.verbose(`[createE2eNxWorkspace] combinedOptions`, combinedOptions);

  const { version, name, args, clean } = combinedOptions;

  const projectConfig = readCachedProjectGraph().nodes[projectName]?.data;

  /** Can not really happen, but safe is safe. */
  if (!projectConfig) {
    throw new Error(
      `[createE2eNxWorkspace] Could not find project config for project ${projectName}`,
    );
  }

  const e2eNxWorkspacesOfProject = join(
    workspaceRoot,
    projectConfig.root,
    'e2e-nx-workspaces',
  );

  const e2eWorkspaceRoot = await createNxWorkspace({
    cwd: e2eNxWorkspacesOfProject,
    version,
    name,
    args,
    clean,
  });

  logger.verbose(
    `[createE2eNxWorkspace] Created nx workspace in ${e2eWorkspaceRoot}`,
  );

  const npmrcPath = join(e2eWorkspaceRoot, '.npmrc');

  const npmrc = await readFile(npmrcPath, { encoding: 'utf-8' }).catch(
    () => '',
  );

  await writeFile(npmrcPath, `${npmrc}\nregistry=${VERDACCIO_URL}`, {
    encoding: 'utf-8',
  });

  return e2eWorkspaceRoot;
};

interface CreateNxWorkspaceOptions {
  /** The directory in which to execute `create-nx-workspace`. */
  cwd: string;

  /** The name of the workspace e.g. 'my-nx-workspace' */
  name: string;

  /**
   * If true, cleans `{{cwd}}/{{name}}`. Note that `create-nx-workspace` fails
   * if there is a workspace already.
   */
  clean?: boolean;

  /**
   * The nx version to use for `create-nx-workspace@{nxVersion}`, must be a
   * valid npm version identifier e.g. `1.2.3`.
   */
  version: string;

  /** Additional arguments for `create-nx-workspace`. */
  args?: Record<string, string | number | boolean>;
}

/**
 * Creates a nx workspace with `create-nx-workspace`.
 *
 * - Disables nx cloud
 *
 * @returns The workspace root of the created nx workspace.
 */
const createNxWorkspace = async (options: CreateNxWorkspaceOptions) => {
  const { cwd, name, version, args, clean } = options;

  const workspaceRoot = join(cwd, name);

  logger.verbose(
    `[createNxWorkspace] Creating nx@${version} workspace in ${workspaceRoot}`,
  );

  if (clean) {
    logger.verbose(`[createNxWorkspace] Cleaning ${workspaceRoot}`);

    await rm(workspaceRoot, {
      recursive: true,
      force: true,
    });
  }

  await mkdir(cwd, {
    recursive: true,
  });

  const createNxWorkspaceCmd = `create-nx-workspace@${version} --name=${name} --skipGit=true --nxCloud=skip --interactive=false ${Object.entries(
    args ?? {},
  )
    .map(([name, value]) => `--${name}=${value}`)
    .join(' ')}`;

  logger.verbose(`[createNxWorkspace] Running ${createNxWorkspaceCmd}`);

  const createNxWorkspaceResult = spawnSync(
    'pnpx',
    createNxWorkspaceCmd.trim().split(' '),
    {
      cwd,
    },
  );

  if (createNxWorkspaceResult.status !== 0) {
    throw new Error(
      `[createNxWorkspace] Failed to create nx workspace in ${workspaceRoot}`,
      {
        cause: createNxWorkspaceResult.error,
      },
    );
  }

  return workspaceRoot;
};
