# Подключение ЮKassa

1. Зарегистрируйтесь в [ЮKassa](https://yookassa.ru/), создайте магазин, возьмите **shopId** и **секретный ключ**.
2. Скопируйте `.env.example` в `.env.local` (локально) или задайте переменные на сервере:
   - `YOOKASSA_SHOP_ID`
   - `YOOKASSA_SECRET_KEY`
   - `NEXT_PUBLIC_SITE_URL` — точный URL сайта с протоколом, например `https://example.com`
3. В личном кабинете ЮKassa укажите URL для HTTP-уведомлений:  
   `https://ВАШ_ДОМЕН/api/yookassa/webhook`  
   (сейчас маршрут только логирует событие — при необходимости добавьте проверку IP/подписи по [документации](https://yookassa.ru/developers/using-api/webhooks).)
4. После оплаты пользователь вернётся на `/payment/return`.

**Важно:** сумма заказа на сервере пересчитывается по каталогу `lib/services-catalog.ts`, а не по данным из браузера.
