#!/usr/bin/env bash
set -euo pipefail

REMOTE="${1:-origin}"
BRANCH="${2:-$(git branch --show-current)}"

if [[ -z "$BRANCH" ]]; then
  echo "❌ Cannot detect current branch."
  exit 1
fi

if ! git remote get-url "$REMOTE" >/dev/null 2>&1; then
  echo "❌ Remote '$REMOTE' is not configured."
  echo "   Add it first: git remote add $REMOTE <git-url>"
  exit 1
fi

echo "🔄 Fetching $REMOTE..."
git fetch "$REMOTE"

if git show-ref --verify --quiet "refs/remotes/$REMOTE/$BRANCH"; then
  echo "🧩 Rebasing '$BRANCH' onto '$REMOTE/$BRANCH'..."
  git rebase "$REMOTE/$BRANCH"
else
  echo "ℹ️ Remote branch '$REMOTE/$BRANCH' not found; will push as new branch."
fi

echo "🚀 Pushing '$BRANCH' to '$REMOTE'..."
git push --set-upstream "$REMOTE" "$BRANCH"

echo "✅ Done."
