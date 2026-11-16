#!/usr/bin/env bash
# Open a PR that reverts the most recent merge of the instrumentation PR, returning main to the bare app.
# Usage: scripts/rollback.sh <merge-commit-sha>
set -euo pipefail
sha="${1:?usage: rollback.sh <merge-commit-sha of the instrumentation PR>}"
git fetch -q origin && git checkout -q main && git pull -q --ff-only origin main
branch="rollback/$(date +%Y%m%d-%H%M%S)"
git checkout -q -b "$branch"
git revert -m 1 --no-edit "$sha"
git push -q -u origin "$branch"
gh pr create --base main --head "$branch" --title "Roll back Novus instrumentation" --body "Reverts $sha. Merge to return the demo app to its bare state."
