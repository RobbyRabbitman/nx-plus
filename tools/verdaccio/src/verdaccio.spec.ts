import { execSync } from 'child_process';
import { assertVerdaccioAvailable, isVerdaccioAvailable } from './verdaccio.js';

vi.mock('child_process');

describe('[Unit Test] isVerdaccioAvailable', () => {
  it('should return false when Verdaccio is not available', () => {
    vi.mocked(execSync).mockImplementationOnce(() => {
      throw new Error('Oopsie!');
    });

    expect(isVerdaccioAvailable()).toBe(false);
  });

  it('should return true when Verdaccio is available', () => {
    vi.mocked(execSync).mockImplementationOnce(() => {
      return Buffer.from('pong');
    });

    expect(isVerdaccioAvailable()).toBe(true);
  });
});

describe('[Unit Test] assertVerdaccioAvailable', () => {
  it('should throw an error when Verdaccio is not available', () => {
    vi.mocked(execSync).mockImplementationOnce(() => {
      throw new Error('Oopsie!');
    });

    expect(() => assertVerdaccioAvailable()).toThrowError(
      '[assertVerdaccioAvailable] The Verdaccio instance of this workspace is not available at http://localhost:4433.',
    );
  });

  it('should not throw an error when Verdaccio is available', () => {
    vi.mocked(execSync).mockImplementationOnce(() => {
      return Buffer.from('pong');
    });

    expect(() => assertVerdaccioAvailable()).not.toThrowError();
  });
});
