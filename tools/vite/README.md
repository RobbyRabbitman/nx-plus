# tools-vite

Shares vite configurations for this workspace.

## vitest

### TODO

Projects vite config cannot use ts paths defined in the root tsconfig. Vite cli (not the test run itself) apparently does not pick this config.

Example:

```ts
// eslint-disable-next-line @nx/enforce-module-boundaries
import { nodeTypescript } from '../../tools/vite/src/vitest-node-typescript';

export default nodeTypescript();
```

Therefore in `vitest-local-registry.ts` there is also a relative import, which makes this library not buildable with `tsc`.

### node + typescript

- Cache
- Ts paths via `nxViteTsPaths` plugin
- Test files typechecking
- Coverage

### local registry

- Publishes this workspace as a global setup
- Serves those packages in a local registry while the test is running
