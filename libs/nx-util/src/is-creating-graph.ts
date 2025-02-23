/**
 * Whether nx is creating the project graph.
 *
 * This information is e.g. useful for plugins to run different code during
 * graph creation versus during task execution.
 *
 * @see {@link https://nx.dev/reference/environment-variables#environment-variables}
 */
export function isCreatingGraph() {
  return process.env.NX_GRAPH_CREATION === 'true';
}
