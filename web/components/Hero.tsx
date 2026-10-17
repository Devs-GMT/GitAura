"use client";

import { useEffect, useRef, useState } from "react";
import { COPY } from "@/lib/copy";
import { Eyebrow } from "./Eyebrow";
import { PromptBox } from "./PromptBox";
import { Voxels } from "./Voxels";

// Fase 6: Peek hanya mendemokan ticker loading. Flow sungguhan (stats → /api/aura → AuraCard) di Fase 7.
const DEMO_LOADING_MS = 3 * 900;

export function Hero() {
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <section className="relative overflow-hidden">
      <Voxels corner="top-left" size={240} className="opacity-90 max-md:hidden" />
      <Voxels corner="bottom-right" size={280} rotate={-8} className="max-md:w-[180px]" />

      <div className="container-page relative flex flex-col items-center py-[72px] text-center md:py-[120px]">
        <Eyebrow>{COPY.hero.eyebrow}</Eyebrow>
        <h1 className="mt-5 max-w-[14ch] text-[44px] font-semibold leading-none tracking-[-0.03em] md:text-[80px]">
          {COPY.hero.title}
        </h1>
        <p className="mt-6 max-w-[620px] text-[16px] leading-[1.55] text-muted md:text-[18px]">{COPY.hero.subtitle}</p>

        <div id="peek" className="mt-10 w-full max-w-[640px] scroll-mt-24 text-left">
          <PromptBox
            loading={loading}
            onPeek={() => {
              setLoading(true);
              timer.current = setTimeout(() => setLoading(false), DEMO_LOADING_MS);
            }}
          />
        </div>
      </div>
    </section>
  );
}
