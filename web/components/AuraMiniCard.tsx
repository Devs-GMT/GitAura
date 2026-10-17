import Link from "next/link";
import { languageAt } from "@/lib/config";
import { avatarUrl, type OnchainAura } from "@/lib/chain";
import { Badge } from "./Badge";

/** Kartu mini galeri: strip gradient, avatar, title, @username, Verified. */
export function AuraMiniCard({ aura }: { aura: OnchainAura }) {
  const lang = languageAt(aura.topLang);
  return (
    <Link
      href={`/a/${aura.id}`}
      className="group flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card transition-transform duration-200 ease-out hover:-translate-y-0.5"
    >
      <span className="h-3 w-full" style={{ background: `linear-gradient(90deg, ${lang.from}, ${lang.to})` }} aria-hidden="true" />
      <span className="flex flex-1 flex-col gap-3 p-5">
        <span className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- avatar GitHub eksternal */}
            <img src={avatarUrl(aura.username, 80)} alt={`@${aura.username} avatar`} width={40} height={40} loading="lazy" className="size-10 shrink-0 overflow-hidden rounded-full bg-preview text-[0px]" />
            <span className="truncate font-mono text-[13px] text-muted">@{aura.username}</span>
          </span>
          <Badge kind="verified" />
        </span>
        <span className="text-[18px] font-semibold leading-snug tracking-[-0.01em] group-hover:underline group-hover:underline-offset-4">
          {aura.title}
        </span>
        <span className="mt-auto font-mono text-[12px] text-muted">
          #{aura.id} · {lang.name}
        </span>
      </span>
    </Link>
  );
}
