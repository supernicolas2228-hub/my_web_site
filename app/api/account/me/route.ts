import { getContactFromRequest } from "@/lib/contact-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const contact = getContactFromRequest(request);
  if (!contact) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    contact: {
      id: contact.id,
      phone: contact.phone,
      email: contact.email,
      phone_verified: Boolean(contact.phone_verified),
      email_verified: Boolean(contact.email_verified)
    }
  });
}
