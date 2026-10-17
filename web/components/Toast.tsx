"use client";

import { useEffect } from "react";

/** Toast pojok bawah ("Link copied", error tx). Hilang otomatis. */
export function Toast({ message, onDone, ms = 2200 }: { message: string | null; onDone: () => void; ms?: number }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, ms);
    return () => clearTimeout(t);
  }, [message, onDone, ms]);

  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-6 z-50 mx-auto w-fit animate-fade-in rounded-pill bg-ink px-5 py-3 text-[14px] font-medium text-white shadow-card"
    >
      {message}
    </div>
  );
}
