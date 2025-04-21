import { BlobServiceClient } from '@azure/storage-blob';
import { nxHttpCacheHandler } from '@robby-rabbitman/nx-plus-nx-http-cache';
import { createNxCacheAzureBlobStorageClient } from './create-nx-cache-azure-blob-storage-client.js';
import { NxCacheAzureBlobStorage } from './nx-cache-azure-blob-storage.js';

/**
 * Creates a http handler that implements the
 * {@link https://nx.dev/recipes/running-tasks/self-hosted-caching#open-api-specification Nx Remote Caching OpenAPI}
 * for connecting to an azure blob storage.
 *
 * ## Example
 *
 * A simple http server for demonstration purposes:
 *
 * ```ts
 * import { createServer } from 'http';
 * import { nxHttpCacheHandlerForAzureBlobStorage } from '@robby-rabbitman/nx-plus-nx-http-cache-azure-blob-storage';
 *
 * const server = createServer(
 *   nxHttpCacheHandlerForAzureBlobStorage({
 *     // TODO: make sure to provide tokens in a secure way
 *     readAccessToken: 'my-read-access-token',
 *     writeAccessToken: 'my-write-access-token',
 *   }),
 *   {
 *     // or set NX_PLUS_SELF_HOSTED_REMOTE_CACHE_AZURE_CONTAINER env var
 *     container: 'my-container-name',
 *     // or set NX_PLUS_SELF_HOSTED_REMOTE_CACHE_AZURE_BLOB_STORAGE_URL env var
 *     // or provide a BlobServiceClient instance
 *     clientOrUrl: 'https://my-account.blob.core.windows.net',
 *   },
 * );
 *
 * server.listen(3000);
 * ```
 *
 * @see {@link createNxCacheAzureBlobStorageClient}
 * @see {@link nxHttpCacheHandler}
 * @see {@link NxCacheAzureBlobStorage}
 */

export async function nxHttpCacheHandlerForAzureBlobStorage(
  options: {
    readAccessToken: string;
    writeAccessToken: string;
  },
  azure?: {
    container?: string;
    clientOrUrl?: BlobServiceClient | string;
  },
) {
  const client =
    azure?.clientOrUrl instanceof BlobServiceClient
      ? azure.clientOrUrl
      : createNxCacheAzureBlobStorageClient(azure?.clientOrUrl);

  const containerName =
    azure?.container ??
    process.env.NX_PLUS_SELF_HOSTED_REMOTE_CACHE_AZURE_CONTAINER;

  if (!containerName) {
    throw new Error(
      'No container name provided. Please provide a container name or set the NX_CACHE_AZURE_BLOB_STORAGE_CONTAINER environment variable.',
    );
  }

  const container = client.getContainerClient(containerName);

  if (!(await container.exists())) {
    throw new Error(
      `Container "${container.containerName}" does not exist. Please create it first.`,
    );
  }

  return nxHttpCacheHandler(new NxCacheAzureBlobStorage(container), options);
}
