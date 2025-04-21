import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';

export function createNxCacheAzureBlobStorageClient(url?: string) {
  url ??= process.env.NX_PLUS_SELF_HOSTED_REMOTE_CACHE_AZURE_URL;

  if (!url) {
    throw new Error('NX_PLUS_SELF_HOSTED_REMOTE_CACHE_AZURE_URL missing.');
  }

  return new BlobServiceClient(url, new DefaultAzureCredential());
}
