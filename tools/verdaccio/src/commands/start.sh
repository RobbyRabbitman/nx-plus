#!/bin/bash

echo "⚙️ Starting verdaccio ..."

mkdir -p tools/verdaccio/.logs
nohup sh -c 'pnpm verdaccio --config tools/verdaccio/src/config/config.yaml > tools/verdaccio/.logs/verdaccio.log 2>&1 &' > /dev/null
