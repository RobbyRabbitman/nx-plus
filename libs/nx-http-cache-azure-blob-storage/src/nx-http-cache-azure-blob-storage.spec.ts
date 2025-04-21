import { BlobServiceClient } from '@azure/storage-blob';
import { nxHttpCacheHandler } from '@robby-rabbitman/nx-plus-nx-http-cache';
import { NxCacheAzureBlobStorage } from './nx-cache-azure-blob-storage';
import { nxHttpCacheHandlerForAzureBlobStorage } from './nx-http-cache-handler-for-azure-blob-storage';

vi.mock('@azure/identity');
vi.mock('@azure/storage-blob', () =>
  vi.importActual('./__mocks__/@azure/storage-blob/index'),
);
vi.mock('@robby-rabbitman/nx-plus-nx-http-cache');

describe('[Unit Test] nxHttpCacheHandlerForAzureBlobStorage', () => {
  it("should throw if container doesn't exist", async () => {
    const client = new BlobServiceClient('some-azure-url');

    client.getContainerClient('non-existing-container').exists = async () =>
      false;

    await expect(
      nxHttpCacheHandlerForAzureBlobStorage(
        {
          readAccessToken: 'read-token',
          writeAccessToken: 'write-token',
        },
        {
          container: 'non-existing-container',
          clientOrUrl: client,
        },
      ),
    ).rejects.toThrowError(
      'Container "non-existing-container" does not exist. Please create it first.',
    );
  });

  it("should return a 'nxHttpCacheHandler'", async () => {
    await nxHttpCacheHandlerForAzureBlobStorage(
      {
        readAccessToken: 'read-token',
        writeAccessToken: 'write-token',
      },
      {
        container: 'some-container',
        clientOrUrl: 'some-azure-url',
      },
    );

    expect(nxHttpCacheHandler).to.have.been.lastCalledWith(
      expect.any(NxCacheAzureBlobStorage),
      {
        readAccessToken: 'read-token',
        writeAccessToken: 'write-token',
      },
    );
  });
});
