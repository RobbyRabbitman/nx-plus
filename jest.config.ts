import { getJestProjectsAsync } from '@nx/jest';
export * from './libs/jest-util/src/jest-config';

export default async () => ({
  projects: await getJestProjectsAsync(),
});
