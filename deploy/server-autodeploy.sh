#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/business-card-site}"
BRANCH="${BRANCH:-main}"
REMOTE="${REMOTE:-origin}"
LOCK_FILE="${LOCK_FILE:-/var/lock/truewebwork-autodeploy.lock}"
LOG_TAG="${LOG_TAG:-truewebwork-autodeploy}"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "[$(date -Is)] autodeploy skipped: lock is busy" | systemd-cat -t "$LOG_TAG" || true
  exit 0
fi

cd "$APP_DIR"

if [[ ! -d .git ]]; then
  echo "[$(date -Is)] autodeploy failed: $APP_DIR is not a git repo" | systemd-cat -t "$LOG_TAG" || true
  exit 1
fi

current_head="$(git rev-parse HEAD)"
git fetch "$REMOTE" "$BRANCH"
remote_head="$(git rev-parse "$REMOTE/$BRANCH")"

if [[ "$current_head" == "$remote_head" ]]; then
  echo "[$(date -Is)] autodeploy: already up to date ($current_head)" | systemd-cat -t "$LOG_TAG" || true
  exit 0
fi

echo "[$(date -Is)] autodeploy: updating $current_head -> $remote_head" | systemd-cat -t "$LOG_TAG" || true
git reset --hard "$REMOTE/$BRANCH"
bash deploy/server-build.sh
