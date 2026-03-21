# Деплой TrueWeb (Next.js) на VPS

Я не могу зайти на твой сервер за тебя — нужен **SSH с твоего ПК**. Ниже точные шаги.

## Что должно быть на сервере

- Node.js **18+** (`node -v`)
- **npm**
- **PM2**: `npm i -g pm2`
- **Nginx**

Папка проекта на сервере (пример): `/var/www/business-card-site`

---

## 1. Залить проект с Windows

**Не заливай** `node_modules` и `.next` — их собирают на сервере.

### Вариант A — архив (проще всего)

1. На ПК: заархивируй папку проекта, **исключив** `node_modules` и `.next`.
2. Загрузи архив на сервер (WinSCP / FileZilla / `scp`).
3. На сервере:

```bash
sudo mkdir -p /var/www/business-card-site
sudo chown -R "$USER:$USER" /var/www/business-card-site
cd /var/www/business-card-site
# распакуй архив сюда (замени имя файла)
unzip -o ~/site.zip -d /var/www/business-card-site
```

### Вариант B — `scp` из PowerShell (если путь без проблем с кодировкой)

```powershell
scp -r "ПУТЬ\к\сайт визитка\*" root@138.124.90.218:/var/www/business-card-site/
```

Перед этим на сервере очисти старые `node_modules` / `.next` или заливай в пустую папку.

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

## 4. После каждого обновления сайта

1. Залить новые файлы (без `node_modules` / `.next`).
2. На сервере:

```bash
cd /var/www/business-card-site
bash deploy/server-build.sh
```

---

## Проблемы

| Симптом | Что проверить |
|--------|----------------|
| 502 Bad Gateway | `pm2 status`, `pm2 logs business-card-site`, порт **3000** |
| Главная есть, `/about` нет | Nginx должен проксировать **весь** `/`, не статику из другой папки |
| Старый контент | Снова `npm run build` и `pm2 reload` |
