[![NPM downloads per week](https://img.shields.io/npm/dw/%40robby-rabbitman%2Fnx-plus-web-dev-server?logo=npm)](https://www.npmjs.com/package/@robby-rabbitman/nx-plus-web-dev-server)
[![NPM version](https://img.shields.io/npm/v/%40robby-rabbitman%2Fnx-plus-web-dev-server?logo=npm)](https://www.npmjs.com/package/@robby-rabbitman/nx-plus-web-dev-server)
[![Nx peer dependency version](https://img.shields.io/npm/dependency-version/%40robby-rabbitman%2Fnx-plus-web-dev-server/peer/%40nx%2Fdevkit?logo=nx&label=nx)](https://nx.dev)

# nx-plus-web-dev-server

[Nx](https://nx.dev) plugin to infer [Web Dev Server](https://modern-web.dev/docs/dev-server/overview) in a workspace.

## 🚀 Getting started

```sh
npm i -D @robby-rabbitman/nx-plus-web-dev-server
```

```sh
nx g @robby-rabbitman/nx-plus-web-dev-server:init
```

Projects with a Web Dev Server now have a _serve_ target.

```sh
nx run {{project}}:serve
```

## 📖 Documentation

### `@robby-rabbitman/nx-plus-web-dev-server:init`

Adds [`@robby-rabbitman/nx-plus-web-dev-server/plugin`](#robby-rabbitmannx-plus-web-dev-serverplugin) to the `plugins` in the `nx.json`.

#### Usage

```sh
nx g @robby-rabbitman/nx-plus-web-dev-server:init
```

#### Options

| Option          | Type    | Default | Description                                   |
| --------------- | ------- | ------- | --------------------------------------------- |
| target-name     | string  | 'serve' | The name of the Web Dev Server target.        |
| skip-format     | boolean | false   | Whether to skip formatting the updated files. |
| skip-add-plugin | boolean | false   | Whether to skip adding the plugin.            |

### `@robby-rabbitman/nx-plus-web-dev-server/plugin`

Adds a _serve_ target for projects that have a [Web Dev Server config](https://modern-web.dev/docs/dev-server/cli-and-configuration/#configuration-file) file in their root, the plugin infers a Web Dev Server with one of the following names.

- `web-dev-server.config.js`
- `web-dev-server.config.cjs`
- `web-dev-server.config.mjs`
- `wds.config.js`
- `wds.config.cjs`
- `wds.config.mjs`

#### Options

```json5
// nx.json
"plugins": [
    {
      "plugin": "@robby-rabbitman/nx-plus-web-dev-server/plugin",
      "options": {
        // the name of the web dev server target => nx run {{project}}:serve
        "targetName": "serve"
      }
    },
]
```