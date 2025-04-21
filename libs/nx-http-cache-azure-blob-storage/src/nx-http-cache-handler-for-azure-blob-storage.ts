import { BlobServiceClient } from '@azure/storage-blob';
import { nxHttpCacheHandler } from '@robby-rabbitman/nx-plus-nx-http-cache';
import { createNxCacheAzureBlobStorageClient } from './create-nx-cache-azure-blob-storage-client.js';
import { NxCacheAzureBlobStorage } from './nx-cache-azure-blob-storage.js';

export async function nxHttpCacheHandlerForAzureBlobStorage(
  options: {
    readAccessToken: string;
    writeAccessToken: string;
  },
  azure: {
    container: string;
    clientOrUrl?: BlobServiceClient | string;
  },
) {
  const client =
    azure.clientOrUrl instanceof BlobServiceClient
      ? azure.clientOrUrl
      : createNxCacheAzureBlobStorageClient(azure.clientOrUrl);
  const container = client.getContainerClient(azure.container);

  if (!(await container.exists())) {
    throw new Error(
      `Container "${container.containerName}" does not exist. Please create it first.`,
    );
  }

  return nxHttpCacheHandler(new NxCacheAzureBlobStorage(container), options);
}
