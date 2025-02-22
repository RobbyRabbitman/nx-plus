import { isVerdaccioAvailable } from './verdaccio.js';

describe('[Integration Test] isVerdaccioAvailable', () => {
  it('should be available ', () => {
    expect(isVerdaccioAvailable()).toBe(true);
  });
});
