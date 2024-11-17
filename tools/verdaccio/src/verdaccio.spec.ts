import { execSync } from 'child_process';
import { vi } from 'vitest';
import { isVerdaccioAvailable } from './verdaccio.js';

vi.mock('child_process');

describe('[Unit Test] isVerdaccioAvailable', () => {
  it('should return `false` when Verdaccio is not available', () => {
    vi.mocked(execSync).mockImplementationOnce(() => {
      throw new Error('Oopsie!');
    });
    expect(isVerdaccioAvailable()).toBe(false);
  });

  it('should return `true` when Verdaccio is available', () => {
    vi.mocked(execSync).mockImplementationOnce(() => {
      return Buffer.from('pong');
    });
    expect(isVerdaccioAvailable()).toBe(true);
  });
});
