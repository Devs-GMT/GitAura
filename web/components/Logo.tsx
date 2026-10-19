import Link from "next/link";
import { COPY } from "@/lib/copy";

/** Wordmark "GitAura." warna aksen (UI_COPY §Nav); favicon memakai inisial "GA.". */
export function Logo() {
  return (
    <Link href="/" className="text-[22px] font-bold leading-none tracking-[-0.03em] text-accent" aria-label="GitAura home">
      {COPY.nav.logo}
    </Link>
  );
}
