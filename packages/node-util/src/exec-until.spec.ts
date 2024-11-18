import { ChildProcess } from 'child_process';
import { describe, expect, it, vitest } from 'vitest';
import { execUntil } from './exec-until.js';

describe('execUntil', { timeout: 30_000 }, () => {
  const TIMEOUT = Symbol('Time out :(');

  const resolveBefore = <T>(p: Promise<T>, timeout: number) =>
    Promise.race([
      p,
      new Promise<T>((_, reject) => setTimeout(() => reject(TIMEOUT), timeout)),
    ]);

  it('should resolve when the stdout matches the predicate', async () => {
    const predicate = vitest.fn((x) => /2/.test(x));

    const p = await resolveBefore(
      execUntil("seq 1 5 | xargs -I{} sh -c 'echo {}; sleep 0.5'", predicate),
      10_000,
    );

    expect(p).instanceOf(ChildProcess);
  });

  it('should resolve when the stderr matches the predicate', async () => {
    const predicate = vitest.fn((x) => /2/.test(x));

    const p = await resolveBefore(
      execUntil(
        "seq 1 5 | xargs -I{} sh -c 'echo {} >&2; sleep 0.5'",
        predicate,
      ),
      10_000,
    );

    expect(p).instanceOf(ChildProcess);
  });

  it('should kill the process when the stdout matches the predicate', async () => {
    const predicate = vitest.fn((x) => /2/.test(x));

    const p = await resolveBefore(
      execUntil("seq 1 10 | xargs -I{} sh -c 'echo {}; sleep 0.5'", predicate),
      4_000,
    );

    expect(p.killed).toBe(true);
    expect(predicate).toHaveBeenCalledTimes(2);
    expect(predicate).toHaveBeenNthCalledWith(1, expect.stringMatching(/1/));
    expect(predicate).toHaveBeenNthCalledWith(2, expect.stringMatching(/2/));

    expect(
      resolveBefore(
        execUntil(
          "seq 1 10 | xargs -I{} sh -c 'echo {}; sleep 0.5'",
          () => false,
        ),
        4_000,
      ),
    ).rejects.toBe(TIMEOUT);
  });

  it('should kill the process when the stderr matches the predicate', async () => {
    const predicate = vitest.fn((x) => /2/.test(x));

    const p = await resolveBefore(
      execUntil(
        "seq 1 10 | xargs -I{} sh -c 'echo {} >&2; sleep 0.5'",
        predicate,
      ),
      4_000,
    );

    expect(p.killed).toBe(true);
    expect(predicate).toHaveBeenCalledTimes(2);
    expect(predicate).toHaveBeenNthCalledWith(1, expect.stringMatching(/1/));
    expect(predicate).toHaveBeenNthCalledWith(2, expect.stringMatching(/2/));

    expect(
      resolveBefore(
        execUntil(
          "seq 1 10 | xargs -I{} sh -c 'echo {} >&2; sleep 0.5'",
          () => false,
        ),
        4_000,
      ),
    ).rejects.toBe(TIMEOUT);
  });

  it('should reject when process has exited and the stdout or stderr had not matched the predicate', () => {
    const predicate = vitest.fn(() => false);

    expect(
      resolveBefore(execUntil("echo 'hi!'", predicate), 10_000),
    ).rejects.toMatch(/stdout and stderr did not match predicate!/);
  });
});
