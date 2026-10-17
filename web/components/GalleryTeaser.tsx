import Link from "next/link";
import { listAuras } from "@/lib/chain";
import { COPY } from "@/lib/copy";
import { AuraMiniCard } from "./AuraMiniCard";

const TEASER = 6;

/** 6 aura terbaru di landing (DESIGN_SYSTEM §5.5). Server component; gagal RPC → pesan galeri. */
export async function GalleryTeaser() {
  let result: Awaited<ReturnType<typeof listAuras>> | null = null;
  try {
    result = await listAuras(0, TEASER);
  } catch {
    result = null;
  }

  return (
    <section className="container-page pb-[72px] md:pb-[120px]" aria-labelledby="gallery-teaser">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="gallery-teaser" className="text-[32px] font-semibold tracking-[-0.02em] md:text-[48px]">
            {COPY.gallery.title}
          </h2>
          <p className="mt-2 text-[16px] text-muted">{COPY.gallery.subtitle}</p>
        </div>
        <Link href="/gallery" className="text-[15px] font-medium underline underline-offset-4">
          {COPY.gallery.teaser}
        </Link>
      </div>

      <div className="mt-8">
        {!result ? (
          <p role="alert" className="text-muted">{COPY.errors.galleryFailed}</p>
        ) : result.items.length === 0 ? (
          <p className="text-muted">{COPY.gallery.empty}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((a) => (
              <AuraMiniCard key={a.id} aura={a} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
