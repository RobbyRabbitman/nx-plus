# @robby-rabbitman/nx-plus-nx-http-cache

A http handler that implements the [Nx Remote Caching OpenAPI](https://nx.dev/recipes/running-tasks/self-hosted-caching#open-api-specification) for connecting a custom cache solution.

## Example

```ts
import { createServer } from 'http';
import {
  nxHttpCacheHandler,
  NxCache,
} from '@robby-rabbitman/nx-plus-nx-http-cache';

// TODO: make sure to implement your caching solution
class MyCache
  implements
    NxCache
{
  get: (
    hash: string,
  ) => Promise<Buffer>;

  has: (
    hash: string,
  ) => Promise<boolean>;

  set: (
    hash: string,
    data: Buffer,
  ) => Promise<void>;
}

const server =
  createServer(
    nxHttpCacheHandler(
      new MyCache(),
      {
        readAccessToken:
          'my-read-access-token',
        writeAccessToken:
          'my-write-access-token',
      },
    ),
  );

server.listen(
  3000,
);
```
