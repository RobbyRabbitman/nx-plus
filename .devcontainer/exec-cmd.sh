#!/bin/sh

DEVCONTAINERS_CLI_VERSION=$(jq -r '.devDependencies["@devcontainers/cli"]' package.json)

set -e
pnpx @devcontainers/cli@$DEVCONTAINERS_CLI_VERSION up --workspace-folder . ${NX_PLUS_DEV_CONTAINER_UP_ARGS}

set +e
echo "⚙️ Executing command inside dev container:\n\n\t$@\n"
pnpx @devcontainers/cli@$DEVCONTAINERS_CLI_VERSION exec --workspace-folder . ${NX_PLUS_DEV_CONTAINER_EXEC_ARGS} "$@"
CMD_EXIT_CODE=$?
set -e

exit ${CMD_EXIT_CODE}
