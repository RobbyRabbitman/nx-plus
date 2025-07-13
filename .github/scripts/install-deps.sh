#!/bin/sh

set +e
installLog=$(pnpm i 2>&1)
exit_code=$?
set -e

echo "$installLog"

NX_CLOUD_DISABLED_MSG="This Nx Cloud organization has been disabled due to exceeding the FREE plan."

if [ $exit_code -ne 0 ] && echo "$installLog" | grep -qi "$NX_CLOUD_DISABLED_MSG"; then
  echo "Nx Cloud organization has been disabled, disabling Nx Cloud for this run."
  echo "NX_NO_CLOUD=true" >>"$GITHUB_ENV"
  # trigger postinstall scripts again, because they might have been errored due to the Nx Cloud error
  pnpm i
else
  exit $exit_code
fi
