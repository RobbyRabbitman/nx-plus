import { readJsonFile, workspaceRoot, writeJsonFile } from '@nx/devkit';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { check, lock } from 'proper-lockfile';
import { mergeConfig, UserConfig } from 'vitest/config';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { localRegistryTarget, publish } from '../../local-registry';

const verbose = process.env['NX_VERBOSE_LOGGING'] === 'true';

function verboseLogging(...args: Parameters<(typeof console)['log']>) {
  console.log(...args);
}

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
    } else {
      verboseLogging('Local registry already started');
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
  verboseLogging('Start local registry');
  const { stopLocalRegistry } = await publish({
    clearStorage: true,
    stopLocalRegistry: false,
    tag: 'local',
    specifier: '0.0.0-local',
    storage: join(workspaceRoot, 'tmp', 'vitest-local-registry', 'storages'),
    projects: [],
    verbose: false,
    localRegistryTarget,
  });

  global.stopLocalRegistry = stopLocalRegistry;
}

function stopLocalRegistry() {
  if (global.stopLocalRegistry) {
    verboseLogging('Stop local registry');
    global.stopLocalRegistry();
  }
}

async function getSetupCount() {
  const setupCountPath = join(
    workspaceRoot,
    'tmp',
    'tools-vite',
    'vitest-local-registry',
    'setup-count',
  );

  const setupCountDir = dirname(setupCountPath);

  mkdirSync(setupCountDir, { recursive: true });

  if (
    existsSync(join(setupCountDir, 'setup.lock')) &&
    !(await check(join(setupCountDir, 'setup.lock')))
  ) {
    writeJsonFile(setupCountPath, { setupCount: 0 });
  }

  verboseLogging('Requesting lock');
  const setupCountLock = await lock(setupCountDir, {
    lockfilePath: join(setupCountDir, 'setup.lock'),
    retries: {
      forever: true,
    },
  });
  verboseLogging('Apply lock');
  let hasLock = true;

  const removeSetupCountLock = () => {
    verboseLogging('Remove lock');
    hasLock = false;
    setupCountLock();
  };

  try {
    const lockFileExists = existsSync(setupCountPath);

    if (!lockFileExists) {
      writeJsonFile(setupCountPath, { setupCount: 0 });
    }

    let setupCount = readJsonFile(setupCountPath).setupCount;
    verboseLogging('Setup count', setupCount);

    const incrementSetupCount = () => {
      if (verbose) {
        console.log(`Trying to increment ${setupCount}`);
      }
      if (hasLock) {
        console.log(`Increment ${setupCount}`);
        writeJsonFile(setupCountPath, { setupCount: ++setupCount });
        console.log(`Incremented to ${setupCount}`);
      }
    };

    const decrementSetupCount = () => {
      if (verbose) {
        console.log(`Trying to decrement ${setupCount}`);
      }
      if (hasLock) {
        console.log(`Decrement ${setupCount}`);
        writeJsonFile(setupCountPath, {
          setupCount: Math.max(0, --setupCount),
        });
        console.log(`Decremented to ${setupCount}`);
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
  } catch (error) {
    removeSetupCountLock();
    throw error;
  }
}
