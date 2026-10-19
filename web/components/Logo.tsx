import Link from "next/link";
import { COPY } from "@/lib/copy";

/** Logo = inisial "GA." warna aksen (UI_COPY §Nav). */
export function Logo() {
  return (
    <Link href="/" className="text-[24px] font-bold leading-none tracking-[-0.04em] text-accent" aria-label="GitAura home">
      {COPY.nav.logo}
    </Link>
  );
}
