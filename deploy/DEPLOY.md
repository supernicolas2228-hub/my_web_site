# Деплой TrueWeb (Next.js) на VPS

## Деплой из GitHub (основной путь)

В репозитории есть workflow **Deploy VPS** (`.github/workflows/deploy-vps.yml`).

1. На VPS один раз нужен **нормальный git-клон** проекта в `/var/www/business-card-site`.
2. В GitHub: **Settings → Secrets and variables → Actions** добавьте `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`.
3. После этого основной сценарий такой: **push в `main` -> GitHub Actions -> `git fetch/reset` на сервере -> `bash deploy/server-build.sh`**.
4. Вручную можно запустить тот же workflow: **Actions → Deploy VPS → Run workflow**.

Опциональный секрет `VPS_PATH` — если проект не в `/var/www/business-card-site`.

---

Автоматический деплой с вашего компьютера по-прежнему требует **SSH-ключ** в `.deploy.env` (`TRUWEB_VPS_SSH_KEY=...`) или ручную заливку архива, но это уже запасной путь, а не основной.

## Что должно быть на сервере

- Node.js **18+** (`node -v`)
- **npm**
- **PM2**: `npm i -g pm2`
- **Nginx**

Папка проекта на сервере (пример): `/var/www/business-card-site`

---

## 1. One-time bootstrap сервера

Если сервер ещё не в виде git-клона:

```bash
git clone https://github.com/ВАШ_АККАУНТ/my_web_site.git /var/www/business-card-site
cd /var/www/business-card-site
chmod +x deploy/server-build.sh
bash deploy/server-build.sh
```

Если на сервере уже есть рабочие `.env` и `data/`, сначала перенеси их в новый каталог.

---

## 2. Сборка и PM2 (на сервере)

Скопируй на сервер файл `ecosystem.config.cjs` (он в корне проекта).

```bash
cd /var/www/business-card-site
chmod +x deploy/server-build.sh
bash deploy/server-build.sh
```

Или вручную:

```bash
cd /var/www/business-card-site
npm ci
npm run build
pm2 start ecosystem.config.cjs   # первый раз
# или после обновлений:
pm2 reload ecosystem.config.cjs --update-env
pm2 save
```

Проверка, что Next отвечает:

```bash
curl -I http://127.0.0.1:3000/
curl -I http://127.0.0.1:3000/about
```

Оба должны дать **HTTP/1.1 200** (или 307/308 на редирект — главное не 404).

---

## 3. Nginx → прокси на Next (чтобы работали все страницы)

1. Скопируй содержимое `deploy/nginx-next-proxy.conf` в файл на сервере, например:

```bash
sudo nano /etc/nginx/sites-available/truweb.conf
```

2. Включи сайт и отключи конфликтующие `default`, если мешают:

```bash
sudo ln -sf /etc/nginx/sites-available/truweb.conf /etc/nginx/sites-enabled/truweb.conf
sudo nginx -t
sudo systemctl reload nginx
```

Важно: для этого сайта **не** используй `root` + `try_files ... /index.html` — только **`proxy_pass`** на `http://127.0.0.1:3000`, как в примере.

3. Когда будет **домен**, поменяй `server_name` и поставь SSL:

```bash
sudo certbot --nginx -d твой-домен.ru
```

---

## 4. Запасной ручной деплой

Если GitHub Actions временно недоступен, на сервере достаточно одной команды:

```bash
cd /var/www/business-card-site && bash deploy/full-refresh-production.sh
```

Это делает `git fetch/reset` и затем запускает `deploy/server-build.sh`.

`npm run deploy:vps` и ручная заливка архива остаются только как fallback для нестандартных ситуаций.

---

## 5. После каждого обновления сайта

Нормальный сценарий: просто сделать `push` в `main`.

Если нужен ручной fallback:

```bash
cd /var/www/business-card-site && bash deploy/full-refresh-production.sh
```

---

## 6. Проблемы

| Симптом | Что проверить |
|--------|----------------|
| 502 Bad Gateway | `pm2 status`, `pm2 logs business-card-site`, порт **3000** |
| Главная есть, `/about` нет | Nginx должен проксировать **весь** `/`, не статику из другой папки |
| Старый контент | Снова `npm run build` и `pm2 reload` |
