# tools-local-registry

Sets up a local registry for this repository, so that `nx release` can be invoked locally:

- `publish` publishes this repository with `nx release` to `{projectRoot}/tmp/storage`
- `serve` starts a local registry which serves published packages from `{projectRoot}/tmp/storage`
- `test` invokes `publish` but publishes to `{projectRoot}/tmp/storage-test` => _testing nx release locally_

## TODO

### Feature

- singleton config for publish and serve targets
  - `nx run tools-local-registry:publish --singleton` or `nx run tools-local-registry:publish:singleton`
  - useful for parallel e2e targets
  - [sidecar task](https://github.com/nrwl/nx/discussions/23273)

Targets depending on _a_ local registry cannot run in parallel because there might be other tasks depending on _a_ local registry. `@nx/js:verdaccio` sets in the global `.npmrc` the registry to the local registry instance: `registry=http://localhost:{port}/`, npm cannot handle multiple registries for 1 scope. When a second local registry is started, a different unused port is used and `@nx/js:verdaccio` sets `registry=http://localhost:{other-port}/`.

### Refactor

- how to revert the changes made by `nx release` in the publish script?
  - is there a better way than git?
  - save the state before invoking `nx release` and restore it after?
    - what about other tasks that might change the repo? => set paralellism to false?
