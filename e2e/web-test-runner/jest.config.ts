import { Config } from 'jest';

/* eslint-disable */
export default {
  displayName: 'web-test-runner-e2e',
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../coverage/packages/web-test-runner-e2e',
} satisfies Config;
