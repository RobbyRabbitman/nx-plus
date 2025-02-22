import { assertVerdaccioAvailable, isVerdaccioAvailable } from './verdaccio.js';

describe('[Integration Test] isVerdaccioAvailable', () => {
  it('should be available', () => {
    expect(isVerdaccioAvailable()).toBe(true);
  });
});

describe('[Integration Test] assertVerdaccioAvailable', () => {
  it('should not throw', () => {
    expect(() => assertVerdaccioAvailable()).not.toThrow();
  });
});
