# TrueWeb — сайт-визитка

Next.js 14 (App Router), Tailwind CSS, Framer Motion, тёмная/светлая тема.

## Команды

```bash
npm install
npm run dev    # http://localhost:3000
npm run build
npm start
```

## Страницы

- `/` — главная
- `/about` — подробный текст «О нас»

## Деплой на VPS

См. [`deploy/DEPLOY.md`](deploy/DEPLOY.md), конфиг PM2: `ecosystem.config.cjs`, пример Nginx: `deploy/nginx-next-proxy.conf`.

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
