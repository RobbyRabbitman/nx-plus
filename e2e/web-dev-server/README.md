# e2e-web-dev-server

e2e test for the web dev server:

- init generator for the plugin
- plugin for inferring web dev server

## local developement

```sh
nx run tools-local-registry:publish
nx run tools-local-registry:serve --clear false
nx run e2e-web-dev-server:{{ target }}
```
