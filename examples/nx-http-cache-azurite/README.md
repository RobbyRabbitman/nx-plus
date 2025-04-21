# @robby-rabbitman/nx-plus-examples-nx-http-cache-azurite

1. Start azurite

   ```sh
   nx run examples-nx-http-cache-azurite:azurite-blob
   ```

2. Serve the http cache server

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
