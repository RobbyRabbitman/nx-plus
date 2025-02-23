import { isCreatingGraph } from './is-creating-graph';

describe('[Unit Test] isCreatingGraph', () => {
  it('should return true if nx is creating the project graph', () => {
    vi.stubEnv('NX_GRAPH_CREATION', 'true');

    expect(isCreatingGraph()).toBe(true);
  });

  it('should return false if nx is not creating the project graph', () => {
    vi.stubEnv('NX_GRAPH_CREATION', 'false');

    expect(isCreatingGraph()).toBe(false);
  });
});
