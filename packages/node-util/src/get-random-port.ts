import { createServer } from 'net';

/** @returns A port which is unused. */
export function getRandomPort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();

    let port: number | undefined;

    server.listen(0, () => {
      const address = server.address();

      if (typeof address === 'object') {
        port = address?.port;
      }

      server.close();
    });

    server.on('close', () => {
      if (port == null) {
        return reject();
      }

      resolve(port);
    });
  });
}
