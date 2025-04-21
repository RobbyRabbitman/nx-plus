import * as azure from '@azure/storage-blob';

export class BlobServiceClient implements Partial<azure.BlobServiceClient> {
  public readonly containerClients = new Map<string, azure.ContainerClient>();

  constructor(public url: string) {}

  getContainerClient(containerName: string) {
    if (!this.containerClients.has(containerName)) {
      this.containerClients.set(
        containerName,
        new ContainerClient(containerName) as unknown as azure.ContainerClient,
      );
    }

    return this.containerClients.get(
      containerName,
    ) as unknown as azure.ContainerClient;
  }
}

export class ContainerClient implements Partial<azure.ContainerClient> {
  public readonly blockBlobClients = new Map<string, azure.BlockBlobClient>();

  constructor(public containerName: string) {}

  async exists() {
    return true;
  }

  getBlockBlobClient(blobName: string) {
    if (!this.blockBlobClients.has(blobName)) {
      this.blockBlobClients.set(
        blobName,
        new BlockBlobClient() as unknown as azure.BlockBlobClient,
      );
    }

    return this.blockBlobClients.get(
      blobName,
    ) as unknown as azure.BlockBlobClient;
  }
}

export class BlockBlobClient implements Partial<azure.BlockBlobClient> {
  protected blob?: Buffer;

  async downloadToBuffer() {
    return this.blob ?? Buffer.from('');
  }

  async exists() {
    return this.blob != null;
  }

  async upload(body: azure.HttpRequestBody) {
    if (body instanceof Buffer) {
      this.blob = body;
    } else {
      throw new Error('Unsupported body type');
    }

    return undefined as unknown as azure.BlockBlobUploadResponse;
  }
}
