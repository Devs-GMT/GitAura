import Link from "next/link";
import type { OnchainAura } from "@/lib/chain";
import { COPY } from "@/lib/copy";
import { OnchainAuraCard } from "./OnchainAuraCard";
import { PixelSparkles } from "./PixelSparkles";

const CTA =
  "inline-flex h-12 items-center justify-center rounded-[14px] bg-accent px-6 text-[16px] font-semibold text-white transition-[filter] duration-200 ease-out hover:brightness-95";

/** Satu kartu read-only (`/a/[id]` dan `/?aura=id`). `aura === null` → "Aura not found"; RPC gagal → pesan muat ulang. */
export function AuraSingle({ aura, failed = false }: { aura: OnchainAura | null; failed?: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <PixelSparkles corner="top-left" size={220} className="opacity-90 max-md:hidden" />
      <div className="container-page relative flex flex-col items-center py-[56px] md:py-[96px]">
        <div className="flex w-full max-w-[640px] flex-col gap-6">
          {aura ? (
            <OnchainAuraCard aura={aura} />
          ) : (
            <div role="alert" className="rounded-card border border-border bg-surface p-10 text-center shadow-card">
              <p className="text-[24px] font-semibold tracking-[-0.02em]">{failed ? COPY.errors.galleryFailed : COPY.errors.auraNotFound}</p>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/" className={CTA}>
              {COPY.gallery.findYours}
            </Link>
            <Link href="/gallery" className="inline-flex h-12 items-center rounded-[14px] border border-border bg-surface px-5 text-[15px] font-medium hover:border-ink">
              {COPY.gallery.teaser}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
