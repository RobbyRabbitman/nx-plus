# tools-vite

Shares vite configurations for this workspace.

- vitest
  - node + typescript
    - Cache
    - Ts paths via `nxViteTsPaths` plugin
    - Test files typechecking
    - Coverage
  - local registry
    - publishes and serves this workspace with `nx release` to a local registry as a global setup
    - terminates the local registry as a global tear down

## TODO

### Feature

- [singleton local registry](../local-registry/README.md#todo)

### Module boundaries

Project's vite config cannot use ts paths defined in the root tsconfig. Vite cli (not the test run itself) apparently does not pick this config.

Example:

```ts
// eslint-disable-next-line @nx/enforce-module-boundaries
// import { nodeTypescript } from '@robby-rabbitman/nx-plus-tools-vite';
import { nodeTypescript } from '../../tools/vite/src/vitest-node-typescript';

export default nodeTypescript();
```

Therefore in `vitest-local-registry.ts` there is a relative import, which makes this library not buildable with `tsc`.
