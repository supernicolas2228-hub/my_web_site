"use client";

import { CalculatorProvider } from "@/context/CalculatorContext";
import { CartProvider } from "@/context/CartContext";
import type { ReactNode } from "react";
import ThemeProvider from "./ThemeProvider";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <CalculatorProvider>
        <CartProvider>{children}</CartProvider>
      </CalculatorProvider>
    </ThemeProvider>
  );
}
