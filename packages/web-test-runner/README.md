[![NPM downloads per week](https://img.shields.io/npm/dw/%40robby-rabbitman%2Fnx-plus-web-test-runner?logo=npm)](https://www.npmjs.com/package/@robby-rabbitman/nx-plus-web-test-runner)
[![NPM version](https://img.shields.io/npm/v/%40robby-rabbitman%2Fnx-plus-web-test-runner?logo=npm)](https://www.npmjs.com/package/@robby-rabbitman/nx-plus-web-test-runner)
[![Nx peer dependency version](https://img.shields.io/npm/dependency-version/%40robby-rabbitman%2Fnx-plus-web-test-runner/@nx/devkit?label=Nx&logo=nx&style=flat-square)](https://nx.dev)

# nx-plus-web-test-runner

[Nx](https://nx.dev) plugin to infer the [Web Test Runner](https://modern-web.dev/docs/test-runner/overview) in a workspace.

## 🚀 Getting started

```sh
npm i -D @robby-rabbitman/nx-plus-web-test-runner
```

```sh
nx g @robby-rabbitman/nx-plus-web-test-runner:init
```

Projects with a Web Test Runner now have a `test` target.

```sh
nx run {{project}}:test
```

## 📖 Documentation

### `@robby-rabbitman/nx-plus-web-test-runner:init`

Adds [`@robby-rabbitman/nx-plus-web-test-runner/plugin`](#robby-rabbitmannx-plus-web-test-runnerplugin) to the `plugins` in the `nx.json`.

#### Usage

```sh
nx g @robby-rabbitman/nx-plus-web-test-runner:init
```

#### Options

| Option          | Type    | Default | Description                                   |
| --------------- | ------- | ------- | --------------------------------------------- |
| target-name     | string  | 'test'  | The name of the Web Test Runner target.       |
| skip-format     | boolean | false   | Whether to skip formatting the updated files. |
| skip-add-plugin | boolean | false   | Whether to skip adding the plugin.            |

### `@robby-rabbitman/nx-plus-web-test-runner/plugin`

Adds a _test_ target for projects that have a [Web Test Runner config](https://modern-web.dev/docs/test-runner/cli-and-configuration/#configuration-file) file in their root, the plugin infers a Web Test Runner with one of the following names.

- `web-test-runner.config.js`
- `web-test-runner.config.cjs`
- `web-test-runner.config.mjs`
- `wtr.config.js`
- `wtr.config.cjs`
- `wtr.config.mjs`

#### Options

```json
// nx.json
"plugins": [
    {
      "plugin": "@robby-rabbitman/nx-plus-web-test-runner/plugin",
      "options": {
        // the name of the web test runner target => nx run {{project}}:test
        "targetName": "test"
      }
    },
]
```
