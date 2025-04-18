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
  options: {
    readAccessToken: string;
    writeAccessToken: string;
  },
  azure: {
    container: string;
    client?: BlobServiceClient;
  },
) {
  const client = azure.client ?? createNxCacheBlobStorageContainerClient();
  const container = client.getContainerClient(azure.container);

  if (!(await container.exists())) {
    throw new Error(
      `Container ${container} does not exist. Please create it first.`,
    );
  }

  return nxHttpCacheHandler(new NxCacheAzureBlobStorage(container), options);
}

export function createNxCacheBlobStorageContainerClient(url?: string) {
  url ??= process.env.NX_PLUS_SELF_HOSTED_REMOTE_CACHE_AZURE_URL;

  if (!url) {
    throw new Error('NX_PLUS_SELF_HOSTED_REMOTE_CACHE_AZURE_URL missing.');
  }

  return new BlobServiceClient(url, new DefaultAzureCredential());
}
