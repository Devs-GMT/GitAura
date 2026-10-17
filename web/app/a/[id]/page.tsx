import type { Metadata } from "next";
import { AuraSingle } from "@/components/AuraSingle";
import { Footer } from "@/components/Footer";
import { StandaloneHeader } from "@/components/StandaloneHeader";
import { auraMetadata, loadAura } from "@/lib/aura-page";

// Aura bisa di-stamp ulang (update di tempat) → segarkan tiap menit.
export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return auraMetadata(await loadAura(id), `/a/${id}`);
}

export default async function AuraPage({ params }: Props) {
  const { id } = await params;
  const { aura, failed } = await loadAura(id);
  return (
    <>
      <StandaloneHeader />
      <main>
        <AuraSingle aura={aura} failed={failed} />
      </main>
      <Footer />
    </>
  );
}
