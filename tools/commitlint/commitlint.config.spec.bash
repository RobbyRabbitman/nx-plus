#!/usr/bin/env bash

test() {
  local commit_message=$1
  local expected_status=$2

  # TODO: invoke tools-commitlint:exec or ts tests
  (echo "$commit_message" | pnpm exec commitlint --config=$(pwd)/commitlint.config.ts --quiet)

  local commitlint_status=$?

  if [ $commitlint_status -ne $expected_status ]; then
    printf "❌ Expected commitlint status of '$commit_message' to be $expected_status, but got $commitlint_status\n"
    exit 1
  fi

  printf "✅️ '$commit_message'\n"
}

# invalid type
test "not_a_valid_type: add documentation" 1

# valid type, but invalid scope
test "docs(not-a-valid-scope): add documentation" 1

# valid type and scope
test "docs(tools-commitlint): add documentation" 0

# scopeless
test "docs: add documentation" 0
