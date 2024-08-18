# tools-tsc

## Plugin

Infers typescript projects and adds a build task with `@nx/js:tsc`.

```json5
// nx-json
{
  "plugin": "@robby-rabbitman/nx-plus-tools-tsc",
  "options": {
    "tscTargetConfig": {
      "inputs": ["default", "^default", "typescriptGlobals"]
    }
  },
},
```

## TODO

- add a secondary entry `tsc-plugin.ts` when secondary entry points work for local plugins.
- check why the local plugin `libs-e2e-version-matrix` cannot use the inferred build task
