"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

/** Ganti kalimat tiap ~900ms dengan fade + caret ▉. Reduced motion → kalimat terakhir, statis. */
export function TickerText({ lines, intervalMs = 900 }: { lines: readonly string[]; intervalMs?: number }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setI((n) => Math.min(n + 1, lines.length - 1)), intervalMs);
    return () => clearInterval(t);
  }, [reduced, lines.length, intervalMs]);

  const text = reduced ? lines[lines.length - 1] : lines[i];
  return (
    <p role="status" aria-live="polite" className="font-mono text-[15px] text-ink">
      <span key={text} className="animate-fade-in inline-block">
        {text}
      </span>
      <span className="ml-1 animate-blink text-accent" aria-hidden="true">
        ▉
      </span>
    </p>
  );
}
