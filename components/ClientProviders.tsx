"use client";

import AnalyticsCartBridge from "@/components/AnalyticsCartBridge";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { CalculatorProvider } from "@/context/CalculatorContext";
import { CartProvider } from "@/context/CartContext";
import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import ThemeProvider from "./ThemeProvider";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <CalculatorProvider>
          <CartProvider>
            <AnalyticsTracker />
            {children}
            <AnalyticsCartBridge />
          </CartProvider>
        </CalculatorProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
