"use client";

import { motion, useInView } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Задержка появления, сек */
  delay?: number;
  /** Смещение по Y при старте, px */
  y?: number;
};

/**
 * Появление при скролле. Важно: не прячем блок через opacity:0 в SSR/до гидрации —
 * иначе в Safari/WebView при сбое JS или поздней загрузке чанков страница остаётся «пустой»
 * (видна только шапка и фон). Анимируем в основном сдвиг по Y, opacity всегда 1.
 */
export default function Reveal({ children, className, delay = 0, y = 28 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    once: true,
    amount: 0.02,
    margin: "160px 0px 160px 0px"
  });
  const [fallbackVisible, setFallbackVisible] = useState(false);

  useEffect(() => {
    if (inView) return;
    const id = window.setTimeout(() => setFallbackVisible(true), 2000);
    return () => window.clearTimeout(id);
  }, [inView]);

  const show = inView || fallbackVisible;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={{ opacity: 1, y: show ? 0 : y }}
      transition={{ duration: 0.55, delay: show ? delay : 0, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
