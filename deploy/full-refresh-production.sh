#!/usr/bin/env bash
# VPS, из корня репозитория:
#   sudo bash deploy/full-refresh-production.sh
# С заменой nginx-конфига (путь свой!):
#   sudo NGINX_SITE_CONF=/etc/nginx/sites-available/truewebwork.conf bash deploy/full-refresh-production.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -d .git ]]; then
  echo "ERROR: $(pwd) is not a git repository."
  echo "Bootstrap once with: git clone <repo> /var/www/business-card-site"
  exit 1
fi

git fetch origin main
git reset --hard origin/main

chmod +x deploy/server-build.sh
bash deploy/server-build.sh

if [[ -n "${NGINX_SITE_CONF:-}" ]]; then
  echo "==> nginx: копируем в $NGINX_SITE_CONF"
  cp deploy/nginx-production-truewebwork.conf "$NGINX_SITE_CONF"
  nginx -t
  systemctl reload nginx
fi

echo "==> Готово."
