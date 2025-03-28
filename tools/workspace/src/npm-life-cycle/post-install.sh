#!/bin/sh

echo "⚙️ Building tools ..."
for tsconfig in $(find tools -name 'tsconfig.lib.json'); do
  tool=$(dirname "$tsconfig")
  echo "⚙️ Building $tool ..."
  pnpm tsc --build $tsconfig
done

echo "⚙️ Building local plugins ..."
localPlugins="libs/web-test-runner libs/web-dev-server"
for plugin in $localPlugins; do
  echo "⚙️ Building $plugin ..."
  pnpm tsc --build $plugin/tsconfig.lib.json
done

echo "⚙️ Starting verdaccio ..."
pnpm nx run tools-verdaccio:start
