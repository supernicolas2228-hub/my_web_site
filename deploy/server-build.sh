#!/usr/bin/env bash
# Запускать НА СЕРВЕРЕ из каталога проекта после заливки файлов:
#   cd /var/www/business-card-site && bash deploy/server-build.sh

set -euo pipefail
cd "$(dirname "$0")/.."

# БД не в архиве деплоя — каталог с правами на запись для процесса Node (PM2).
mkdir -p data
chmod 775 data 2>/dev/null || true

# tar при обновлении не удаляет файлы, которых больше нет в архиве — чистим устаревшие API.
rm -rf 'app/api/admin/clients/[id]/stage'

echo "==> npm ci"
# png-to-ico объявляет engines node>=20; на части VPS стоит Node 18 — билд не зависит от генерации ico на сервере.
npm ci --ignore-engines

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
