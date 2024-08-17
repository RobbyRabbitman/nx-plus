import { describe, expect, it } from 'vitest';
import { createVersionMatrix } from './version-matrix';

describe('createVersionMatrix', () => {
  describe('should create all permutations of the peer dependencies', () => {
    it('none', () => {
      expect(
        createVersionMatrix({
          name: 'foo',
          version: 'local',
          peerDependencies: {},
        }),
      ).toEqual([
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {},
        },
      ]);
    });

    it('a@1', () => {
      expect(
        createVersionMatrix({
          name: 'foo',
          version: 'local',
          peerDependencies: { a: ['1'] },
        }),
      ).toEqual([
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: '1',
          },
        },
      ]);
    });

    it('a@1 a@2', () => {
      expect(
        createVersionMatrix({
          name: 'foo',
          version: 'local',
          peerDependencies: { a: ['1', '2'] },
        }),
      ).toEqual([
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: '1',
          },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: '2',
          },
        },
      ]);
    });

    it('a@1 a@2 a@3', () => {
      expect(
        createVersionMatrix({
          name: 'foo',
          version: 'local',
          peerDependencies: { a: ['1', '2', '3'] },
        }),
      ).toEqual([
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: '1',
          },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: '2',
          },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: '3',
          },
        },
      ]);
    });

    it('a@1 b@2', () => {
      expect(
        createVersionMatrix({
          name: 'foo',
          version: 'local',
          peerDependencies: { a: ['1'], b: ['1'] },
        }),
      ).toEqual([
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: '1',
            b: '1',
          },
        },
      ]);
    });

    it('a@1 a@2 b@2', () => {
      expect(
        createVersionMatrix({
          name: 'foo',
          version: 'local',
          peerDependencies: { a: ['1', '2'], b: ['1'] },
        }),
      ).toEqual([
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: '1',
            b: '1',
          },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: '2',
            b: '1',
          },
        },
      ]);
    });

    it('a@1 a@2 a@3 b@1', () => {
      expect(
        createVersionMatrix({
          name: 'foo',
          version: 'local',
          peerDependencies: { a: ['1', '2', '3'], b: ['1'] },
        }),
      ).toEqual([
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: '1',
            b: '1',
          },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: '2',
            b: '1',
          },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: '3',
            b: '1',
          },
        },
      ]);
    });

    it('a@1 a@2 a@3 b@1 b@2', () => {
      expect(
        createVersionMatrix({
          name: 'foo',
          version: 'local',
          peerDependencies: { a: ['1', '2', '3'], b: ['1', '2'] },
        }),
      ).toEqual([
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: '1',
            b: '1',
          },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: '1',
            b: '2',
          },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: '2',
            b: '1',
          },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: '2',
            b: '2',
          },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: '3',
            b: '1',
          },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: '3',
            b: '2',
          },
        },
      ]);
    });

    it('a@1 a@2 a@3 b@1 b@2 c@1 d@1 d@2 d@3 d@4', () => {
      expect(
        createVersionMatrix({
          name: 'foo',
          version: 'local',
          peerDependencies: {
            a: ['1', '2', '3'],
            b: ['1', '2'],
            c: ['1'],
            d: ['1', '2', '3', '4'],
          },
        }),
      ).toEqual([
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '1', b: '1', c: '1', d: '1' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '1', b: '1', c: '1', d: '2' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '1', b: '1', c: '1', d: '3' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '1', b: '1', c: '1', d: '4' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '1', b: '2', c: '1', d: '1' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '1', b: '2', c: '1', d: '2' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '1', b: '2', c: '1', d: '3' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '1', b: '2', c: '1', d: '4' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '2', b: '1', c: '1', d: '1' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '2', b: '1', c: '1', d: '2' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '2', b: '1', c: '1', d: '3' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '2', b: '1', c: '1', d: '4' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '2', b: '2', c: '1', d: '1' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '2', b: '2', c: '1', d: '2' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '2', b: '2', c: '1', d: '3' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '2', b: '2', c: '1', d: '4' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '3', b: '1', c: '1', d: '1' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '3', b: '1', c: '1', d: '2' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '3', b: '1', c: '1', d: '3' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '3', b: '1', c: '1', d: '4' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '3', b: '2', c: '1', d: '1' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '3', b: '2', c: '1', d: '2' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '3', b: '2', c: '1', d: '3' },
        },
        {
          name: 'foo',
          version: 'local',
          peerDependencies: { a: '3', b: '2', c: '1', d: '4' },
        },
      ]);
    });
  });
});
