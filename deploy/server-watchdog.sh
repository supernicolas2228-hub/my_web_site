#!/usr/bin/env bash

set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:3000/api/health}"
HTTPS_URL="${HTTPS_URL:-https://www.truewebwork.ru/api/health}"
APP_NAME="${APP_NAME:-business-card-site}"
TIMEOUT="${TIMEOUT:-12}"
LOG_TAG="${LOG_TAG:-truewebwork-watchdog}"

check_app() {
  curl -fsS --max-time "$TIMEOUT" "$APP_URL" >/dev/null
}

check_https_stack() {
  curl -kfsS --max-time "$TIMEOUT" \
    --resolve "www.truewebwork.ru:443:127.0.0.1" \
    "$HTTPS_URL" >/dev/null
}

if ! check_app; then
  echo "[$(date -Is)] app health failed, restarting $APP_NAME" | systemd-cat -t "$LOG_TAG" || true
  pm2 restart "$APP_NAME"
  sleep 8
  check_app
fi

if ! check_https_stack; then
  echo "[$(date -Is)] nginx https stack failed, restarting nginx" | systemd-cat -t "$LOG_TAG" || true
  systemctl restart nginx
  sleep 5
  check_https_stack
fi
