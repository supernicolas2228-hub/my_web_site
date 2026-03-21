#!/usr/bin/env bash
# Запускать НА СЕРВЕРЕ из каталога проекта после заливки файлов:
#   cd /var/www/business-card-site && bash deploy/server-build.sh

set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> npm ci"
npm ci

echo "==> npm run build"
npm run build

echo "==> PM2"
if pm2 describe business-card-site >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi
pm2 save

echo "==> Готово. Проверка: curl -sI http://127.0.0.1:3000/about | head -n1"
curl -sI http://127.0.0.1:3000/about | head -n1 || true
