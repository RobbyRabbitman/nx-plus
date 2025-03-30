import {
  type CreateNodesFunction,
  type CreateNodesV2,
  type TargetConfiguration,
  createNodesFromFiles,
} from '@nx/devkit';
import { existsSync } from 'fs';
import { format, join, parse, relative } from 'path';

type SchemaToTsTargetConfiguration = TargetConfiguration;

interface SchemaToTsPluginOptions {
  schemaToTsTargetName?: string;

  schemaToTsTargetConfiguration?: SchemaToTsTargetConfiguration;
}

/** The glob pattern representing projects that have schema files. */
const SCHEMA_FILES_GLOB = '**/src/**/*.schema.json';

const SCHEMA_TO_TS_COMMAND = 'json2ts';

export const createNodesV2 = [
  SCHEMA_FILES_GLOB,
  (schemaToTsConfigPaths, options, context) =>
    createNodesFromFiles(
      createSchemaToTsTarget,
      schemaToTsConfigPaths,
      options,
      context,
    ),
] satisfies CreateNodesV2<SchemaToTsPluginOptions>;

/** Adds a 'schema to ts' target in the project for each schema file. */
const createSchemaToTsTarget: CreateNodesFunction<
  SchemaToTsPluginOptions | undefined
> = (schemaToTsConfigPath, userOptions) => {
  const options = normalizeSchemaToTsTargetOptions(userOptions);
  const projectRoot = closestProject(schemaToTsConfigPath);

  if (!projectRoot) {
    return {};
  }

  const input = relative(projectRoot, schemaToTsConfigPath);
  const output = format({
    ...parse(input),
    base: '',
    ext: '.ts',
  });

  const schemaToTsTargetName = `${options.schemaToTsTargetName}--${input.replaceAll('/', '__')}`;
  const schemaToTsTargetConfiguration = {
    cache: true,
    inputs: [join('{projectRoot}', input)],
    outputs: [join('{projectRoot}', output)],
    ...options.schemaToTsTargetConfiguration,
    options: {
      cwd: '{projectRoot}',
      input,
      output,
      ...options.schemaToTsTargetConfiguration.options,
    },
  };

  return {
    projects: {
      [projectRoot]: {
        targets: {
          [schemaToTsTargetName]: schemaToTsTargetConfiguration,
        },
      },
    },
  };
};

function normalizeSchemaToTsTargetOptions(
  options: SchemaToTsPluginOptions | undefined,
) {
  const normalizedOptions = {
    schemaToTsTargetName: options?.schemaToTsTargetName || 'pre-build',
    schemaToTsTargetConfiguration: {
      command: SCHEMA_TO_TS_COMMAND,
      ...options?.schemaToTsTargetConfiguration,
      options: options?.schemaToTsTargetConfiguration?.options ?? {},
    },
  } satisfies SchemaToTsPluginOptions;

  return normalizedOptions;
}

/**
 * Returns the closest project by traversing the path to the root of the
 * project. The project is defined by the presence of a `package.json` file.
 */
function closestProject(schemaToTsConfigPath: string) {
  const pathParts = schemaToTsConfigPath.split('/');

  while (pathParts.length > 0) {
    const path = join(...pathParts);

    if (existsSync(join(path, 'package.json'))) {
      return path;
    }

    pathParts.pop();
  }

  return null;
}
