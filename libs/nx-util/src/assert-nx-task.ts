import { NX_ENV_VARS } from './env';

/** Whether the current process is a nx task. */
export function assertNxTask() {
  if (NX_ENV_VARS.NX_TASK_TARGET_PROJECT in process.env) {
    return;
  }

  throw new Error('Not a nx task!');
}
