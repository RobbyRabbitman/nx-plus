import { workspaceRoot } from '@nx/devkit';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { checkSync, lock } from 'proper-lockfile';
import { mergeConfig, UserConfig } from 'vitest/config';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { localRegistryTarget, publish } from '../../local-registry';

export function localRegistry(overrides?: Partial<UserConfig>) {
  return mergeConfig(
    {
      test: {
        globalSetup: [
          join(workspaceRoot, 'tools/vite/src/vitest-local-registry.ts'),
        ],
      },
    },
    overrides ?? {},
  );
}

export async function setup() {
  const setupCount = await getSetupCount();

  try {
    setupCount.increment();

    if (setupCount.count === 1) {
      await startLocalRegistry();
    }
  } finally {
    setupCount.removeLock();
  }
}

export async function teardown() {
  const setupCount = await getSetupCount();

  try {
    setupCount.decrement();

    if (setupCount.count === 0) {
      stopLocalRegistry();
    }
  } catch (error) {
    stopLocalRegistry();
    throw error;
  } finally {
    setupCount.removeLock();
  }
}

async function startLocalRegistry() {
  const { stopLocalRegistry } = await publish({
    clearStorage: true,
    stopLocalRegistry: false,
    tag: 'local',
    specifier: '0.0.0-local',
    storage: join(workspaceRoot, 'tmp', 'vitest-local-registry', 'storages'),
    projects: [],
    verbose: process.env['NX_VERBOSE_LOGGING'] === 'true',
    localRegistryTarget,
  });

  global.stopLocalRegistry = stopLocalRegistry;
}

function stopLocalRegistry() {
  if (global.stopLocalRegistry) {
    global.stopLocalRegistry();
  }
}

async function getSetupCount() {
  const setupCountDir = join(workspaceRoot, 'tmp');

  const setupCountPath = join(
    setupCountDir,
    'tools-vite',
    'vitest-local-registry',
    'setup-count',
  );

  if (!checkSync(setupCountDir)) {
    mkdirSync(setupCountDir, { recursive: true });
  }

  const setupCountLock = await lock(setupCountPath, { realpath: false });
  let hasLock = true;

  const removeSetupCountLock = () => {
    hasLock = false;
    setupCountLock();
  };

  try {
    if (!checkSync(setupCountPath)) {
      writeFileSync(setupCountPath, '0');
    }

    let setupCount = Number(
      readFileSync(setupCountPath, { encoding: 'utf-8' }),
    );

    const incrementSetupCount = () => {
      if (hasLock) {
        writeFileSync(setupCountPath, String(setupCount++));
      }
    };

    const decrementSetupCount = () => {
      if (hasLock) {
        writeFileSync(setupCountPath, String(setupCount--));
      }
    };

    return {
      get count() {
        return setupCount;
      },
      increment: incrementSetupCount,
      decrement: decrementSetupCount,
      removeLock: removeSetupCountLock,
    };
  } catch (errror) {
    removeSetupCountLock();
    throw errror;
  }
}
