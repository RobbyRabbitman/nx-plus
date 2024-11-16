echo "⚙️ Installing Node.js..."
NODE_VERSION=$(jq -r .engines.node package.json)
. ${NVM_DIR}/nvm.sh
nvm install ${NODE_VERSION}
nvm alias default ${NODE_VERSION}
nvm use default

echo "⚙️ Enabling corepack..."
corepack enable

echo "⚙️ Installing npm workspace dependencies..."
pnpm install --frozen-lockfile

echo "⚙️ Installing Nx CLI..."
NX_VERSION=$(jq -r .devDependencies.nx package.json)
pnpm add -g nx@$NX_VERSION
