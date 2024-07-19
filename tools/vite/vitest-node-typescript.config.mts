import { nodeTypescript } from './src/vitest-node-typescript';

export default nodeTypescript({ test: { coverage: { enabled: false } } });
