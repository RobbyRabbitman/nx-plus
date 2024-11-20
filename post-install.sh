#!/bin/sh

# in order to use a nx plugin locally, we need to build it first
echo "⚙️ Building tools-eslint-nx-dependency-checks-plugin ..."
pnpm tsc --build tools/eslint-nx-dependency-checks-plugin/tsconfig.lib.json

# in order for projects to use the vite configs, we need to build them first
echo "⚙️ Building tools-vite ..."
pnpm nx run tools-vite:build-tsc

# in order for projects to use the eslint configs, we need to build them first
echo "⚙️ Building tools-eslint ..."
pnpm nx run tools-eslint:build-tsc