import { type RequestListener } from 'http';

export interface NxCache {
  get: (hash: string) => Promise<Buffer>;
  has: (hash: string) => Promise<boolean>;
  set: (hash: string, data: Buffer) => Promise<void>;
}

/**
 * TODO: how to integrate logging?
 *
 * TODO: two simple tokens suitable or introduce a more complex (in a better
 * sense) auth system?
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
          res.end('Missing hash query parameter');

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
          res.end('Missing or invalid authentication token.');

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
          res.end('Missing hash query parameter');

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
