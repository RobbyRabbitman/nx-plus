# tools-local-registry

Sets up a local registry for this repository:

- `publish` publishes this repository with `nx release` to `{projectRoot}/storage`
- `serve` starts a local registry which serves published packages from `{projectRoot}/storage`
- `test` invokes `publish` => _testing nx release locally_
