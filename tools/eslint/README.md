# tools-eslint

Sets up eslint for this repository.

## Rules

- js
  - [@nx/javascript](https://nx.dev/nx-api/eslint-plugin/documents/overview#javascript)
- ts
  - [@nx/typescript](https://nx.dev/nx-api/eslint-plugin/documents/overview#typescript)
- nx
  - [dependency-checks](https://nx.dev/nx-api/eslint-plugin#dependency-checks-rule)
  - [enforce-module-boundaries](https://nx.dev/nx-api/eslint-plugin#enforce-module-boundaries-rule)

## Usage

Add a `eslint.config.js` in the root of the project and extend the [base.config.js](./src/base.config.js)

```js
// some/project/eslint.config.js

// @ts-check
const baseConfig = require('../../eslint/src/base.config');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [...baseConfig];
```

## nx.json

- `targetDefaults.lint-eslint`
  - inferred by `@nx/eslint/plugin` in `plugins`
- `namedInputs.eslintGlobals`
  - all files within this project

## TODO

### DX

- can projects use a relative path like `@robby-rabbitman/nx-plus-tools-eslint/base-config` ?
  - ts + ts paths?
  - node module resolution
    - file protocol in root package.json with `"@robby-rabbitman/nx-plus-tools-eslint":"<path>"` ???
- check if configs can be written with esm
  - does target project need to use esm aswell?

### migrate

- remove `@eslint/eslintrc`
  - requires nx to use eslints _flat config_ (maybe this is possible already, need to read docs)

### performance

- fine tune of _namedInput_ `eslintGlobals`
  - add _eslint-ish_ external dependendecies
  - default behavior: when no external dependencies are in the inputs of a task, the hash of all external dependencies is used, but needs to be verified
