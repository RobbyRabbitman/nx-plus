import { type UserConfig } from '@commitlint/types';

export default {
  extends: ['@commitlint/config-conventional', '@commitlint/config-nx-scopes'],
} as UserConfig;
