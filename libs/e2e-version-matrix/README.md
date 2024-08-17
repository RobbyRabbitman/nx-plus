# libs-e2e-version-matrix

Plugin to infer a e2e test version matrix based on the peer dependencies of a package.

## TODO

- move me in `libs-e2e-util` when secondary entry points work for local plugins.
- check why the plugin cannot use the inferred build target of `tools-tsc`

### DX

- remove `e2e-version-matrix.config.json` and infer the permutations based on the `package.json`
  - pinned versions are easy but what is the expectation of complex ranges e.g. `1.2.9.beta-2 || ^1.4 || >3`
    - specify a permutation strategy?
