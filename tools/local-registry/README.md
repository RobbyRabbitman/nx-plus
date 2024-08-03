# tools-local-registry

Sets up a local registry for this repository, so that `nx release` can be invoked locally:

- `publish` publishes this repository with `nx release` to `{projectRoot}/storage`
- `serve` starts a local registry which serves published packages from `{projectRoot}/storage`
- `test` invokes `publish` => _testing nx release locally_

## TODO

Targets depending on _a_ local registry cannot run in parallel because there might be other tasks depending on _a_ local registry. `@nx/js:verdaccio` sets in the global `.npmrc` the registry to the local registry instance: `registry=http://localhost:{port}/`, npm cannot handle multiple registries for 1 scope. When a second local registry is started, a different unused port is used and `@nx/js:verdaccio` sets `registry=http://localhost:{other-port}/`. Thoughts:

- dont use `@nx/js:verdaccio` in `serve` rather `verdaccio` itself => anywhere in this repo explictly set `--registry` when invoking `npm`, but how to get the _right_ registry when there are multiple instances... prolly does not solve the problem
- make `serve` a _singleton_ task => max 1 local registry instance
- run tasks in serial... solves the problem but makes ci slow
