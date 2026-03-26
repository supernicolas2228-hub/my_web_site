"use client";

import { CartProvider } from "@/context/CartContext";
import type { ReactNode } from "react";
import ThemeProvider from "./ThemeProvider";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <CartProvider>{children}</CartProvider>
    </ThemeProvider>
  );
}
