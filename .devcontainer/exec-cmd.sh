#!/bin/sh

DEVCONTAINERS_CLI_VERSION=$(jq -r '.devDependencies["@devcontainers/cli"]' package.json)

set -e
pnpx @devcontainers/cli@$DEVCONTAINERS_CLI_VERSION up --log-level ${NX_PLUS_DEV_CONTAINER_LOG_LEVEL:-'info'} $NX_PLUS_DEV_CONTAINER_UP_ARGS --workspace-folder .

set +e
echo "⚙️ Executing command inside dev container:\n\n\t$@\n"
pnpx @devcontainers/cli@$DEVCONTAINERS_CLI_VERSION exec --log-level ${NX_PLUS_DEV_CONTAINER_LOG_LEVEL:-'info'} $NX_PLUS_DEV_CONTAINER_EXEC_ARGS --workspace-folder . "$@"
CMD_EXIT_CODE=$?
set -e

exit ${CMD_EXIT_CODE}
