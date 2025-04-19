import { type RequestListener } from 'http';
import type { NxCache } from './nx-cache.js';

/**
 * Creates a http handler that implements the
 * {@link https://nx.dev/recipes/running-tasks/self-hosted-caching#open-api-specification Nx Remote Caching OpenAPI}
 * for connecting a {@link NxCache custom cache solution}.
 *
 * ## Example
 *
 * A simple (not secure) http server for demonstration purposes:
 *
 * ```ts
 * import { createServer } from 'http';
 * import {
 *   nxHttpCacheHandler,
 *   NxCache,
 * } from '@robby-rabbitman/nx-plus-nx-http-cache';
 *
 * // TODO: make sure to implement your caching solution
 * class MyCache implements NxCache {
 *   get: (hash: string) => Promise<Buffer>;
 *   has: (hash: string) => Promise<boolean>;
 *   set: (hash: string, data: Buffer) => Promise<void>;
 * }
 *
 * const server = createServer(
 *   nxHttpCacheHandler(new MyCache(), {
 *     // TODO: make sure to provide tokens in a secure way
 *     readAccessToken: 'my-read-access-token',
 *     writeAccessToken: 'my-write-access-token',
 *   }),
 * );
 *
 * server.listen(3000);
 * ```
 *
 * Then
 * {@link https://nx.dev/recipes/running-tasks/self-hosted-caching#usage-notes configure your nx workspace to use a remote cache}
 * by setting the following environment variables for the nx cli:
 *
 * ```sh
 * NX_SELF_HOSTED_REMOTE_CACHE_SERVER=http://localhost:3000
 * NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN=my-read-access-token
 * ```
 */
export function nxHttpCacheHandler(
  cache: NxCache,
  options: {
    readAccessToken: string;
    writeAccessToken: string;
  },
): RequestListener {
  return async (req, res) => {
    try {
      if (!req.url) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing URL');

        return;
      }

      const authHeader = req.headers['authorization'];

      if (req.method === 'GET' && req.url.startsWith('/v1/cache')) {
        if (
          !authHeader ||
          !authHeader.startsWith('Bearer ') ||
          (authHeader.split(' ')[1] !== options.readAccessToken &&
            authHeader.split(' ')[1] !== options.writeAccessToken)
        ) {
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('Unauthorized');

          return;
        }

        const hash = req.url.match(/^\/v1\/cache\/([^\/]+)$/)?.[1];

        if (!hash) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Missing hash path parameter');

          return;
        }

        const hasCachedData = await cache.has(hash);

        if (!hasCachedData) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('The record was not found');

          return;
        }

        const cachedData = await cache.get(hash);

        res.setHeader('Content-Type', 'application/octet-stream');
        res.writeHead(200);
        res.end(cachedData);

        return;
      }

      if (req.method === 'PUT' && req.url.startsWith('/v1/cache')) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.writeHead(401, { 'Content-Type': 'text/plain' });
          res.end('Missing authentication token.');

          return;
        }

        if (authHeader.split(' ')[1] !== options.writeAccessToken) {
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('Access forbidden.');

          return;
        }

        const bufferSize = parseInt(req.headers['content-length'] || '0');

        const hash = req.url.match(/^\/v1\/cache\/([^\/]+)$/)?.[1];

        if (!hash) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Missing hash path parameter');

          return;
        }

        const hasCachedData = await cache.has(hash);

        if (hasCachedData) {
          res.writeHead(409, { 'Content-Type': 'text/plain' });
          res.end('Cannot override an existing record');

          return;
        }

        const data = await new Promise<Buffer>((resolve) => {
          const data = Buffer.allocUnsafe(bufferSize);
          let offset = 0;

          req.on('data', (chunk: Buffer) => {
            const bytesToCopy = Math.min(chunk.length, bufferSize - offset);
            chunk.copy(data, offset, 0, bytesToCopy);
            offset += bytesToCopy;

            if (offset > bufferSize) {
              req.destroy();
            }
          });

          req.on('end', () => resolve(data.subarray(0, offset)));
        });

        await cache.set(hash, data);

        res.writeHead(202);
        res.end();

        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } catch (error) {
      console.log(error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  };
}
