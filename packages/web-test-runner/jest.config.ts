import { Config } from 'jest';

/* eslint-disable */
export default {
  displayName: 'web-test-runner',
  preset: '../../jest.preset.js',
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../coverage/packages/web-test-runner',
} satisfies Config;
