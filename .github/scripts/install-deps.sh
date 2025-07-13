#!/bin/sh

installLog=$(npx nx report 2>&1 || true)

echo "$installLog"

NX_CLOUD_DISABLED_MSG="This Nx Cloud organization has been disabled due to exceeding the FREE plan."

if echo "$installLog" | grep -qi "$NX_CLOUD_DISABLED_MSG"; then
  echo "Nx Cloud organization has been disabled, disabling Nx Cloud for this run."
  echo "NX_NO_CLOUD=true" >>"$GITHUB_ENV"
  exit 0
else
  exit $exit_code
fi
