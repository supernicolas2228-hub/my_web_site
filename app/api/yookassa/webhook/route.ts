import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Уведомления ЮKassa. В личном кабинете укажите URL:
 * https://ВАШ_ДОМЕН/api/yookassa/webhook
 *
 * Для продакшена добавьте проверку IP ЮKassa и/или подпись по их документации.
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    // eslint-disable-next-line no-console
    console.log("[yookassa webhook]", JSON.stringify(payload).slice(0, 500));
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
