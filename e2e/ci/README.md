# e2e-ci

Helper scripts for running e2e tests in ci processes.

## TODO

- refactor e2e test with a local registry to a [sidecar task](https://github.com/nrwl/nx/discussions/23273)
- tsnode does not pick up paths => relative imports (bad) => tsc in the build task fails because of root directory `e2e/ci`
  - make tsnode pick up paths of root tsconfig.base.json
