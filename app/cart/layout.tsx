import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Корзина | TrueWeb",
  description: "Корзина услуг TrueWeb и оплата через ЮKassa."
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
