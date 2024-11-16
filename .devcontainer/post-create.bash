#!/usr/bin/env bash

echo "⚙️ Installing node..."
NODE_VERSION=$(jq -r .engines.node package.json)
source ${NVM_DIR}/nvm.sh
nvm install ${NODE_VERSION}
nvm alias default ${NODE_VERSION}
nvm use default

echo "⚙️ Enabling corepack..."
corepack enable

echo "⚙️ Setup pnpm..."
SHELL=bash pnpm setup
source $HOME/.bashrc

echo "⚙️ Installing npm workspace dependencies..."
pnpm install --frozen-lockfile

echo "⚙️ Installing nx cli..."
NX_VERSION=$(jq -r .devDependencies.nx package.json)
pnpm add -g nx@$NX_VERSION
