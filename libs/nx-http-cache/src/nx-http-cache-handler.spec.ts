import { createServer, type Server } from 'http';
import { NxCacheInMemory } from './nx-cache-in-memory';
import { nxHttpCacheHandler } from './nx-http-cache-handler';

describe('[Unit Test] nxHttpCacheHandler', { concurrent: false }, () => {
  let server: Server;
  let url: string;
  let cache: NxCacheInMemory;

  beforeAll(async () => {
    cache = new NxCacheInMemory();

    server = createServer(
      nxHttpCacheHandler(cache, {
        readAccessToken: 'read-token',
        writeAccessToken: 'write-token',
      }),
    );

    const port = await new Promise<number>((resolve, reject) => {
      server.listen(0, () => {
        const address = server.address();

        if (address != null && typeof address === 'object') {
          resolve(address.port);
        }

        reject();
      });
    });

    url = `http://localhost:${port}`;
  }, 10_000);

  afterEach(() => {
    cache.clear();
    expect(cache['data'].size).toBe(0);
  });

  afterAll(() => {
    server.close();
  });

  describe('GET /v1/cache/:hash', () => {
    it('should return 403 without auth header', async () => {
      const response = await fetch(`${url}/v1/cache/123`);

      expect(response.status).toBe(403);
    });

    it('should return 403 without read or write access', async () => {
      const response = await fetch(`${url}/v1/cache/123`, {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.status).toBe(403);
    });

    it('should not return 403 with read access', async () => {
      const response = await fetch(`${url}/v1/cache/123`, {
        headers: {
          Authorization: 'Bearer read-token',
        },
      });

      expect(response.status).not.toBe(403);
    });

    it('should not return 403 with write access', async () => {
      const response = await fetch(`${url}/v1/cache/123`, {
        headers: {
          Authorization: 'Bearer write-token',
        },
      });

      expect(response.status).not.toBe(403);
    });

    it('should return 400 without hash path parameter', async () => {
      const response = await fetch(`${url}/v1/cache`, {
        headers: {
          Authorization: 'Bearer read-token',
        },
      });

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Missing hash path parameter');
    });

    it('should return 404 when the cache does not have data for the requested hash', async () => {
      const response = await fetch(`${url}/v1/cache/123`, {
        headers: {
          Authorization: 'Bearer read-token',
        },
      });

      await expect(cache.has('123')).resolves.toBe(false);

      expect(response.status).toBe(404);
      expect(await response.text()).toBe('The record was not found');
    });

    it('should return 200 with the requested hash when the cache has it', async () => {
      await cache.set('123', Buffer.from('123 data'));

      const response = await fetch(`${url}/v1/cache/123`, {
        headers: {
          Authorization: 'Bearer read-token',
        },
      });

      expect(response.status).toBe(200);
      await expect(response.text()).resolves.toEqual(
        (await cache.get('123')).toString(),
      );
    });
  });

  describe('PUT /v1/cache/:hash', () => {
    it('should return 401 without auth header', async () => {
      const response = await fetch(`${url}/v1/cache/123`, {
        method: 'PUT',
      });

      expect(response.status).toBe(401);
      await expect(response.text()).resolves.toBe(
        'Missing authentication token.',
      );
    });

    it('should return 403 without write access', async () => {
      const response = await fetch(`${url}/v1/cache/123`, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer read-token',
        },
      });

      expect(response.status).toBe(403);
      await expect(response.text()).resolves.toBe('Access forbidden.');
    });

    it('should not return 403 with write access', async () => {
      const response = await fetch(`${url}/v1/cache`, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer write-token',
        },
      });

      expect(response.status).not.toBe(403);
    });

    it('should return 400 without hash path parameter', async () => {
      const response = await fetch(`${url}/v1/cache`, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer write-token',
        },
      });

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Missing hash path parameter');
    });

    it('should return 409 when the cache already has data for the requested hash', async () => {
      await cache.set('123', Buffer.from('123 data'));

      const response = await fetch(`${url}/v1/cache/123`, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer write-token',
        },
        body: Buffer.from('123 data'),
      });

      await expect(cache.has('123')).resolves.toBe(true);

      expect(response.status).toBe(409);
      expect(await response.text()).toBe('Cannot override an existing record');
    });

    it('should return 202 when the cache does not have data for the requested hash and set it in the cache', async () => {
      await expect(cache.has('123')).resolves.toBe(false);

      const response = await fetch(`${url}/v1/cache/123`, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer write-token',
        },
        body: Buffer.from('123 data'),
      });

      await expect(cache.has('123')).resolves.toBe(true);

      expect(response.status).toBe(202);
    });
  });

  it('other paths should return 404', async () => {
    const response = await fetch(`${url}/v1/does-not-exist`);
    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toBe('Not Found');
  });
});
