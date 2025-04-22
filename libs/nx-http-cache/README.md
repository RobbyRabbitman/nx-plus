[![NPM downloads per week](https://img.shields.io/npm/dw/%40robby-rabbitman%2Fnx-plus-nx-http-cache?logo=npm)](https://www.npmjs.com/package/@robby-rabbitman/nx-plus-nx-http-cache)
[![NPM version](https://img.shields.io/npm/v/%40robby-rabbitman%2Fnx-plus-nx-http-cache?logo=npm)](https://www.npmjs.com/package/@robby-rabbitman/nx-plus-nx-http-cache)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=robby-rabbitman-nx-plus--nx-http-cache&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=robby-rabbitman-nx-plus--nx-http-cache)

# @robby-rabbitman/nx-plus-nx-http-cache

A http handler that implements the [Nx Remote Caching OpenAPI](https://nx.dev/recipes/running-tasks/self-hosted-caching#open-api-specification) for integrating a custom cache solution.

Checkout the [azurite blob storage example](../../examples/nx-http-cache-azurite/README.md).

## Usage

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
