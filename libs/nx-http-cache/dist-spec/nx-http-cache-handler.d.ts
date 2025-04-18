import { type RequestListener } from 'http';
export interface NxCache {
    get: (hash: string) => Promise<Buffer>;
    has: (hash: string) => Promise<boolean>;
    set: (hash: string, data: Buffer) => Promise<void>;
}
/**
 * TODO: how to integrate logging?
 *
 * TODO: two simple tokens suitable or introduce a more complex (in a better
 * sense) auth system?
 */
export declare function nxHttpCacheHandler(options: {
    readAccessToken: string;
    writeAccessToken: string;
}, cache: NxCache): RequestListener;
//# sourceMappingURL=nx-http-cache-handler.d.ts.map