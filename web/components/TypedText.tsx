"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

/** Mengetik teks saat terlihat di layar, lalu caret ▉ berkedip. Reduced motion → teks penuh langsung. */
export function TypedText({ text, speedMs = 45 }: { text: string; speedMs?: number }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLParagraphElement>(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || started) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setStarted(true), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started || reduced || count >= text.length) return;
    const t = setTimeout(() => setCount((c) => c + 1), speedMs);
    return () => clearTimeout(t);
  }, [started, reduced, count, text.length, speedMs]);

  const shown = reduced ? text : text.slice(0, count);
  return (
    <p ref={ref} className="font-mono text-[15px] text-ink md:text-[17px]" aria-label={text}>
      <span aria-hidden="true">{shown}</span>
      <span className="ml-1 animate-blink text-accent" aria-hidden="true">
        ▉
      </span>
    </p>
  );
}
