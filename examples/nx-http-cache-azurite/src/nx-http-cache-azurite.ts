import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { nxHttpCacheHandlerForAzureBlobStorage } from '@robby-rabbitman/nx-plus-nx-http-cache-azure-blob-storage';
import { createServer } from 'http';

/**
 * Configure nx by adding a `.env` file in the root of the workspace before
 * running the server.
 *
 * ```sh
 * NX_SELF_HOSTED_REMOTE_CACHE_SERVER=http://localhost:3000
 * NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN=dummy-token
 * ```
 */

const client = new BlobServiceClient(
  'https://127.0.0.1:10000/devstoreaccount1',
  /**
   * TODO: `new DefaultAzureCredential()` is not supported by azurite.
   *
   * https://github.com/Azure/Azurite/issues/2303#issuecomment-2392418810
   */
  new StorageSharedKeyCredential(
    'devstoreaccount1',
    'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==',
  ),
);

await client.getContainerClient('nx-cache').createIfNotExists();

createServer(
  await nxHttpCacheHandlerForAzureBlobStorage(
    {
      readAccessToken: '1',
      writeAccessToken: '2',
    },
    {
      container: 'nx-cache',
      client,
    },
  ),
).listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
