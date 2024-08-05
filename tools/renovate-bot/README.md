# tools-renovate-bot

Sets up [Renovate Bot](https://docs.renovatebot.com/) for this repository.

Since this repository is an [integrated nx monorepo](https://nx.dev/concepts/integrated-vs-package-based#integrated-repos) projects have a `package.json` without lock file, since `node_modules` must only be installed in the root.

Renovate invokes `pnpm` with `--recursive --lockfile-only --ignore-scripts --ignore-pnpmfile`. To prevent lock file creation in the projects, this repo is a pnpm workspace with no packages.
