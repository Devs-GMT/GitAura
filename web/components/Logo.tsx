import Link from "next/link";
import { COPY } from "@/lib/copy";
import { LogoMark } from "./LogoMark";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 text-[20px] font-semibold tracking-[-0.02em]" aria-label="GitAura home">
      <LogoMark className="size-7" />
      {COPY.nav.logo}
    </Link>
  );
}
