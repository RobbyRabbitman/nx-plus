#!/usr/bin/env bash

echo "⚙️ Starting verdaccio..."
mkdir -p .logs
nohup bash -c 'pnpm verdaccio --config src/config/config.yaml &' >&/dev/null