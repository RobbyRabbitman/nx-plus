import { ChildProcess } from 'child_process';
import { execUntil } from './exec-until.js';

describe('[Integration Test] execUntil', { timeout: 30_000 }, () => {
  const TIMEOUT = Symbol('Time out :(');

  const resolveBefore = <T>(p: Promise<T>, timeout: number) =>
    Promise.race([
      p,
      new Promise<T>((_, reject) => setTimeout(() => reject(TIMEOUT), timeout)),
    ]);

  it('should resolve when the stdout matches the predicate', async () => {
    const match2 = vi.fn((x) => /2/.test(x));

    await expect(
      resolveBefore(
        // stdout:
        // 1
        // 2 => predicate matched
        // 3
        // 4
        // ...
        // 10 => TIMEOUT
        // ...
        // 100
        execUntil("seq 1 100 | xargs -I{} sh -c 'echo {}; sleep 1'", match2),
        10_000,
      ),
    ).resolves.toBeInstanceOf(ChildProcess);
  });

  it('should resolve when the stderr matches the predicate', async () => {
    const match2 = vi.fn((x) => /2/.test(x));

    await expect(
      resolveBefore(
        // stderr:
        // 1
        // 2 => predicate matched
        // 3
        // 4
        // ...
        // 10 => TIMEOUT
        // ...
        // 100
        execUntil(
          "seq 1 100 | xargs -I{} sh -c 'echo {} >&2; sleep 1'",
          match2,
        ),
        10_000,
      ),
    ).resolves.toBeInstanceOf(ChildProcess);
  });

  it('should kill the process when the stdout matches the predicate', async () => {
    const match2 = vi.fn((x) => /2/.test(x));

    const process = await resolveBefore(
      // stdout:
      // 1
      // 2 => predicate matched
      // 3
      // 4
      // ...
      // 10 => TIMEOUT
      // ...
      // 100
      execUntil("seq 1 100 | xargs -I{} sh -c 'echo {}; sleep 1'", match2),
      10_000,
    );

    expect(process.killed).toBe(true);
    expect(match2).toHaveBeenCalledTimes(2);
    expect(match2).toHaveBeenNthCalledWith(1, expect.stringMatching(/1/));
    expect(match2).toHaveBeenNthCalledWith(2, expect.stringMatching(/2/));
  });

  it('should kill the process when the stderr matches the predicate', async () => {
    const match2 = vi.fn((x) => /2/.test(x));

    const p = await resolveBefore(
      // stderr:
      // 1
      // 2 => predicate matched
      // 3
      // 4
      // ...
      // 10 => TIMEOUT
      // ...
      // 100
      execUntil("seq 1 100 | xargs -I{} sh -c 'echo {} >&2; sleep 1'", match2),
      4_000,
    );

    expect(p.killed).toBe(true);
    expect(match2).toHaveBeenCalledTimes(2);
    expect(match2).toHaveBeenNthCalledWith(1, expect.stringMatching(/1/));
    expect(match2).toHaveBeenNthCalledWith(2, expect.stringMatching(/2/));
  });

  it('should reject when process has exited and the stdout or stderr had not matched the predicate', () => {
    const neverMatches = vi.fn(() => false);

    expect(
      resolveBefore(
        execUntil("echo 'this predicate does not match'", neverMatches),
        10_000,
      ),
    ).rejects.toMatch(/stdout and stderr did not match predicate!/);
  });
});
