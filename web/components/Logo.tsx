import Link from "next/link";
import { COPY } from "@/lib/copy";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-baseline gap-0.5 text-[20px] font-semibold tracking-[-0.02em]" aria-label="GitAura home">
      {COPY.nav.logo}
      <span className="inline-block size-2 rounded-full bg-accent" aria-hidden="true" />
    </Link>
  );
}
