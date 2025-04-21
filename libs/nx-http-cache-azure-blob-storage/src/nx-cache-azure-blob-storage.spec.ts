import { ContainerClient } from '@azure/storage-blob';
import { NxCacheAzureBlobStorage } from './nx-cache-azure-blob-storage';

vi.mock('@azure/storage-blob', () =>
  vi.importActual('./__mocks__/@azure/storage-blob/index'),
);

describe('[Unit Test] NxCacheAzureBlobStorage', () => {
  function createNxCacheAzureBlobStorage() {
    return new NxCacheAzureBlobStorage(new ContainerClient('some-container'));
  }

  describe('get', () => {
    it('should download the blob', async () => {
      const cache = createNxCacheAzureBlobStorage();
      const container = cache['container'];

      const data = Buffer.from('some-data');
      await container.getBlockBlobClient('some-hash').upload(data, data.length);

      expect((await cache.get('some-hash')).toString()).toEqual(
        data.toString(),
      );
    });

    it('should throw if the blob does not exist', async () => {
      const cache = createNxCacheAzureBlobStorage();

      await expect(cache.get('non-existing-hash')).rejects.toThrowError(
        'Blob with hash "non-existing-hash" does not exist.',
      );
    });
  });

  describe('has', () => {
    it('should return true if the blob exists', async () => {
      const cache = createNxCacheAzureBlobStorage();
      const container = cache['container'];

      const data = Buffer.from('some-data');
      await container.getBlockBlobClient('some-hash').upload(data, data.length);

      expect(await cache.has('some-hash')).toBe(true);
    });

    it('should return false if the blob does not exist', async () => {
      const cache = createNxCacheAzureBlobStorage();

      expect(await cache.has('non-existing-hash')).toBe(false);
    });
  });

  describe('set', () => {
    it('should upload the blob', async () => {
      const cache = createNxCacheAzureBlobStorage();
      const container = cache['container'];

      const data = Buffer.from('some-data');
      await cache.set('some-hash', data);

      expect(
        (
          await container.getBlockBlobClient('some-hash').downloadToBuffer()
        ).toString(),
      ).toEqual(data.toString());
    });
  });
});
