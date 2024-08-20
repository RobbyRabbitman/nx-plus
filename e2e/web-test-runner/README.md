# web-test-runner-e2e

e2e test for the web test runner:

- init generator for the plugin
- plugin for inferring web test runner

## local developement

```sh
nx run tools-local-registry:publish
nx run tools-local-registry:serve --clear false
nx run web-test-runner-e2e:{{ target }}
```
