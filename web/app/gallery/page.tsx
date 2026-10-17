import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { GalleryGrid } from "@/components/GalleryGrid";
import { StandaloneHeader } from "@/components/StandaloneHeader";
import { COPY } from "@/lib/copy";

export const metadata: Metadata = {
  title: `${COPY.gallery.title} · GitAura`,
  description: COPY.gallery.subtitle,
  openGraph: { title: `${COPY.gallery.title} · GitAura`, description: COPY.gallery.subtitle, url: "/gallery" },
};

export default function GalleryPage() {
  return (
    <>
      <StandaloneHeader />
      <main className="container-page py-[56px] md:py-[96px]">
        <header className="mb-10 max-w-[640px]">
          <h1 className="text-[40px] font-semibold leading-none tracking-[-0.03em] md:text-[64px]">{COPY.gallery.title}</h1>
          <p className="mt-4 text-[16px] leading-[1.55] text-muted md:text-[18px]">{COPY.gallery.subtitle}</p>
        </header>
        <GalleryGrid />
      </main>
      <Footer />
    </>
  );
}
