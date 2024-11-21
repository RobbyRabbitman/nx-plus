#!/usr/bin/env bash

# in order to use a nx plugin locally, we need to build it first
echo "⚙️ Building tools-eslint-nx-dependency-checks-plugin ..."
pnpm tsc --build tools/eslint-nx-dependency-checks-plugin/tsconfig.lib.json

# in order for projects to use the vite configs, we need to build them first
echo "⚙️ Building tools-vite ..."
pnpm tsc --build tools/vite/tsconfig.lib.json

# in order for projects to use the eslint configs, we need to build them first
echo "⚙️ Building tools-eslint ..."
pnpm tsc --build tools/eslint/tsconfig.lib.json
