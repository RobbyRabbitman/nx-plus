#!/usr/bin/env bash

# TODO: in order to use a nx plugin locally, we need to build it first
pnpm tsc --build tools/eslint-nx-dependency-checks-plugin/tsconfig.lib.json

pnpm nx run tools-verdaccio:start
