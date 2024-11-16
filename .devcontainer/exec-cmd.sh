set -e
pnpx @devcontainers/cli up --workspace-folder . $NX_PLUS_DEV_CONTAINER_UP_ARGS

set +e
echo "⚙️ Executing command inside dev container:\n\n\t$@\n"
pnpx @devcontainers/cli exec --workspace-folder . $NX_PLUS_DEV_CONTAINER_EXEC_ARGS "$@"
CMD_EXIT_CODE=$?
set -e

exit ${CMD_EXIT_CODE}
