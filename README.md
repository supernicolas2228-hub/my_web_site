# TrueWeb — сайт-визитка

Next.js 14 (App Router), Tailwind CSS, Framer Motion, тёмная/светлая тема.

## Команды

```bash
npm install
npm run dev       # только этот ПК: http://localhost:3000
npm run dev:lan   # телефон в той же Wi‑Fi: http://ВАШ_IP_из_ipconfig:3000
npm run build
npm start
```

## Страницы

- `/` — главная
- `/about` — подробный текст «О нас»
- `/cart` — корзина услуг и оплата ЮKassa
- `/payment/return` — возврат после оплаты

## Корзина и ЮKassa

1. Скопируй [`.env.example`](.env.example) в `.env.local` (локально) или задай переменные на сервере.
2. Нужны: `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL` (публичный URL с `https://`).
3. Подробнее: [`docs/YOOKASSA.md`](docs/YOOKASSA.md).

Сумма заказа на сервере считается по [`lib/services-catalog.ts`](lib/services-catalog.ts), не по данным из браузера.

## Деплой на VPS

См. [`deploy/DEPLOY.md`](deploy/DEPLOY.md), конфиг PM2: `ecosystem.config.cjs`, пример Nginx: `deploy/nginx-next-proxy.conf`.

### Быстрый деплой с Windows

В PowerShell из корня проекта:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\deploy-from-windows.ps1
```

Пароль SSH вводится **у тебя на ПК** (не в чат). Нужны `ssh`, `scp`, `tar` (OpenSSH + Windows 10+).

## Git и GitHub

Если папка **без** связи с GitHub:

1. Создай репозиторий на GitHub (пустой, без README).
2. В этой папке:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ТВОЙ_ЛОГИН/ТВОЙ_РЕПО.git
git push -u origin main
```

Если репозиторий **уже есть** на GitHub — проще **склонировать** его заново и перенести туда файлы проекта (или `git remote add` + `pull` с осторожностью к конфликтам).

**Важно:** не коммить `.env` с секретами — он в `.gitignore`.
