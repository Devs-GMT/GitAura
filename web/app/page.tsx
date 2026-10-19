import type { Metadata } from "next";
import { Suspense } from "react";
import { AuraSingle } from "@/components/AuraSingle";
import { Footer } from "@/components/Footer";
import { GalleryTeaser } from "@/components/GalleryTeaser";
import { HomeClient } from "@/components/HomeClient";
import { HowItWorks } from "@/components/HowItWorks";
import { LangMarquee } from "@/components/LangMarquee";
import { StandaloneHeader } from "@/components/StandaloneHeader";
import { auraMetadata, loadAura } from "@/lib/aura-page";
import { fetchContributions } from "@/lib/contrib";

type Props = { searchParams: Promise<{ aura?: string | string[] }> };

// `/?aura=12` → kartu read-only (share link dari SuccessPanel); tanpa param → landing biasa.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { aura } = await searchParams;
  if (aura === undefined) return {};
  return auraMetadata(await loadAura(aura), `/?aura=${Array.isArray(aura) ? aura[0] : aura}`);
}

export default async function Home({ searchParams }: Props) {
  const { aura: auraParam } = await searchParams;

  if (auraParam !== undefined) {
    const { aura, failed } = await loadAura(auraParam);
    return (
      <>
        <StandaloneHeader />
        <main>
          <AuraSingle aura={aura} failed={failed} weeks={aura ? await fetchContributions(aura.username) : null} />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <HomeClient>
        <LangMarquee />
        <HowItWorks />
        <Suspense fallback={null}>
          <GalleryTeaser />
        </Suspense>
      </HomeClient>
      <Footer />
    </>
  );
}
