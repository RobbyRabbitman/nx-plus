import { ChildProcess, exec, ExecOptions } from 'child_process';

/**
 * Wraps `exec` in a promise which resolves when the stdout or stderr matches a
 * given predicate. When the process exits without a match, the promise is
 * rejected.
 *
 * Inputs and outputs are `utf-8` encoded by default.
 *
 * @see {@link exec}
 */
export function execUntil(
  command: string,
  /** @param output - Stdout or stderr. */
  predicate: (stdoutOrStderr: string) => boolean,
  options?: ExecOptions,
): Promise<ChildProcess> {
  const process = exec(command, { encoding: 'utf-8', ...options });

  return new Promise((resolve, reject) => {
    let output = '';
    let predicateMatched = false;

    const callPredicateOnDataEvent = (data: string) => {
      output += data;

      if (!predicateMatched && predicate(output)) {
        predicateMatched = true;

        // predicate is matched => kill process
        if (!process.killed) {
          process.kill();
        }

        resolve(process);
      }
    };

    process.stdout?.on('data', callPredicateOnDataEvent);
    process.stderr?.on('data', callPredicateOnDataEvent);

    process.on('exit', (code) => {
      // idk about timings, but lets check the match flag
      if (predicateMatched) {
        resolve(process);
      }

      const originalOutput = output
        .split('\n')
        .map((line) => `    ${line}`)
        .join('\n');

      // if the process exits without a match of the predicate, the promise is rejected
      reject(
        `${command} exited with code ${code}, stdout and stderr did not match predicate! Original output:\n${originalOutput}`,
      );
    });
  });
}
