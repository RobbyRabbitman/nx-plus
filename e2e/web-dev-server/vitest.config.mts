// eslint-disable-next-line @nx/enforce-module-boundaries
import { localRegistry, nodeTypescript } from '../../tools/vite/src';

export default nodeTypescript(localRegistry());
