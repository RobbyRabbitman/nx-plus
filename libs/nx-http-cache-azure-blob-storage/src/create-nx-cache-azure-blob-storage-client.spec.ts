import { createNxCacheAzureBlobStorageClient } from './create-nx-cache-azure-blob-storage-client';

vi.mock('@azure/identity');
vi.mock('@azure/storage-blob', () =>
  vi.importActual('./__mocks__/@azure/storage-blob/index'),
);

describe('[Unit Test] createNxCacheAzureBlobStorageClient', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should use the provided url', () => {
    expect(createNxCacheAzureBlobStorageClient('some-azure-url').url).toBe(
      'some-azure-url',
    );
  });

  it('should use the env variable NX_PLUS_SELF_HOSTED_REMOTE_CACHE_AZURE_URL', () => {
    vi.stubEnv('NX_PLUS_SELF_HOSTED_REMOTE_CACHE_AZURE_URL', 'some-azure-url');

    expect(createNxCacheAzureBlobStorageClient().url).toBe('some-azure-url');
  });

  it('should throw if no url is set', () => {
    expect(() => createNxCacheAzureBlobStorageClient()).toThrowError(
      'NX_PLUS_SELF_HOSTED_REMOTE_CACHE_AZURE_URL missing.',
    );
  });
});
