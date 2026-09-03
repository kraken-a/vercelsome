#!/usr/bin/env bash
# Pre-commit: reject commits containing .env backup artifacts
set -e
staged=$(git diff --cached --name-only 2>/dev/null || true)
errors=0
for f in $staged; do
  if echo "$f" | grep -qE '\.env.*\.(bak|tmp|backup|old)[^/]*$|\.env\.production\.[^e]'; then
    echo "[check-secrets] Refusing to commit env backup artifact: $f"
    errors=$((errors+1))
  fi
done
if [ "$errors" -gt 0 ]; then
  echo "[check-secrets] Fix: add the file to .gitignore and unstage it."
  exit 1
fi
exit 0
