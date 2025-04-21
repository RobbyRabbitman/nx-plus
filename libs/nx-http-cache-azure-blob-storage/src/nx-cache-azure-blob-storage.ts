import { ContainerClient } from '@azure/storage-blob';
import { type NxCache } from '@robby-rabbitman/nx-plus-nx-http-cache';

export class NxCacheAzureBlobStorage implements NxCache {
  constructor(protected readonly container: ContainerClient) {}

  async get(hash: string) {
    if (!(await this.has(hash))) {
      throw new Error(`Blob with hash "${hash}" does not exist.`);
    }

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
