import {
  Executor,
  parseTargetString,
  readCachedProjectGraph,
} from '@nx/devkit';

export type E2eVersionMatrixTargetExecutorSchema = {
  e2eTargetName?: string;
  e2eTargetConfigurationPrefix?: string;
};

export const executeE2eVersionMatrix: Executor<
  E2eVersionMatrixTargetExecutorSchema
> = async (options, context) => {
  const { project, target, configuration } = parseTargetString(
    options.e2eTargetName,
    readCachedProjectGraph(),
  );

  const results = [] as {
    success: boolean;
  }[];

  console.log(123);

  // for await (const result of await runExecutor<{
  //   success: boolean;
  // }>({ project, target, configuration }, {}, context)) {
  //   results.push(result);
  // }

  return { success: results.every(({ success }) => success) };
};

export default executeE2eVersionMatrix;
