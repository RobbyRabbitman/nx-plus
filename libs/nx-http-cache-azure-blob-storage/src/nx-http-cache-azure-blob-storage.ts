import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import {
  nxHttpCacheHandler,
  type NxCache,
} from '@robby-rabbitman/nx-plus-nx-http-cache';

export class NxCacheAzureBlobStorage implements NxCache {
  constructor(protected readonly container: ContainerClient) {}

  async get(hash: string) {
    return this.container.getBlockBlobClient(hash).downloadToBuffer();
  }

  async has(hash: string) {
    return this.container.getBlockBlobClient(hash).exists();
  }

  async set(hash: string, data: Buffer) {
    await this.container.getBlockBlobClient(hash).upload(data, data.length, {
      blobHTTPHeaders: {
        blobContentType: 'application/octet-stream',
      },
    });
  }
}

export async function nxHttpCacheHandlerForAzureBlobStorage(
  azure: {
    account: string;
    blobStorageContainer: string;
  },
  options: {
    readAccessToken: string;
    writeAccessToken: string;
  },
) {
  return nxHttpCacheHandler(
    new NxCacheAzureBlobStorage(
      new BlobServiceClient(
        `https://${azure.account}.blob.core.windows.net`,
        new DefaultAzureCredential(),
      ).getContainerClient(azure.blobStorageContainer),
    ),
    options,
  );
}
