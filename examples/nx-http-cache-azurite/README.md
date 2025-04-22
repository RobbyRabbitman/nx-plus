# @robby-rabbitman/nx-plus-examples-nx-http-cache-azurite

This example project uses [azurite](https://github.com/Azure/Azurite) as a nx custom cache solution. It implements the [Nx Remote Caching OpenAPI](https://nx.dev/recipes/running-tasks/self-hosted-caching#open-api-specification) with the help of a [node http server](../../libs/nx-http-cache/README.md).

1. Start azurite

   ```sh
   nx run examples-nx-http-cache-azurite:azurite-blob
   ```

2. Start the server

   ```sh
   nx run examples-nx-http-cache-azurite:serve
   ```

3. Enable custom caching in the nx workspace by adding a `.env` file in the root of the workspace:

   ```sh
   NX_SELF_HOSTED_REMOTE_CACHE_SERVER=http://localhost:3000
   NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN=write
   ```

4. Run a command twice that is cached:

   ```sh
   nx reset
   nx run examples-nx-http-cache-azurite:build-tsc
   nx run examples-nx-http-cache-azurite:build-tsc
   ```
