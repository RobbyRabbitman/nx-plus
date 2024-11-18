import { createServer, Server } from 'net';
import { describe } from 'vitest';
import { getRandomPort } from './get-random-port.js';

vi.mock('net');

describe('[Unit Test] getRandomPort', () => {
  beforeEach(() => {
    vi.mocked(createServer).mockReturnValue({
      address: vi.fn(() => ({ port: 1234 })),
      listen: vi.fn((_, listener) => listener()),
      close: vi.fn(),
      on: vi.fn((_, listener) => listener()),
    } as unknown as Server);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('should return a random port number', async () => {
    await expect(getRandomPort()).resolves.toBe(1234);
  });

  it('should reject when there is no address', async () => {
    vi.mocked(createServer).mockReturnValueOnce({
      ...createServer(),
      address: vi.fn(() => null),
    } as unknown as Server);

    await expect(getRandomPort()).rejects.toBe(undefined);
  });
});
