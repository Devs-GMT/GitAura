"use client";

import { useCallback, useEffect, useState } from "react";
import { listAuras, type OnchainAura } from "@/lib/chain";
import { COPY } from "@/lib/copy";
import { AuraMiniCard } from "./AuraMiniCard";

function Skeleton() {
  return <div className="h-[168px] animate-pulse rounded-card border border-border bg-surface" aria-hidden="true" />;
}

/** Grid 1/2/3 kolom, terbaru dulu, 24 per halaman (BUILD_PLAN Fase 8). Read-only via RPC. */
export function GalleryGrid() {
  const [items, setItems] = useState<OnchainAura[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(false);
    try {
      const res = await listAuras(p);
      setItems((prev) => (p === 0 ? res.items : [...prev, ...res.items]));
      setHasMore(res.hasMore);
      setPage(p);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(0);
  }, [load]);

  if (error && items.length === 0) {
    return <p role="alert" className="py-16 text-center text-[16px] text-muted">{COPY.errors.galleryFailed}</p>;
  }
  if (!loading && items.length === 0) {
    return <p className="py-16 text-center text-[16px] text-muted">{COPY.gallery.empty}</p>;
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy={loading}>
        {items.map((a) => (
          <AuraMiniCard key={a.id} aura={a} />
        ))}
        {loading && Array.from({ length: items.length === 0 ? 6 : 3 }, (_, i) => <Skeleton key={`s${i}`} />)}
      </div>
      {error && <p role="alert" className="text-[14px] text-danger">{COPY.errors.galleryFailed}</p>}
      {hasMore && !loading && (
        <button
          type="button"
          onClick={() => load(page + 1)}
          className="inline-flex h-11 items-center rounded-[12px] border border-border bg-surface px-5 text-[14px] font-medium hover:border-ink"
        >
          {COPY.gallery.loadMore}
        </button>
      )}
    </div>
  );
}
