import { explorerAddressUrl, languageAt } from "@/lib/config";
import { avatarUrl, type OnchainAura } from "@/lib/chain";
import { COPY } from "@/lib/copy";
import { shortAddress } from "@/lib/format";
import { Badge } from "./Badge";

const date = new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" });

/** Kartu read-only yang dimuat dari kontrak (share link / galeri). Data = apa yang tersimpan on-chain. */
export function OnchainAuraCard({ aura }: { aura: OnchainAura }) {
  const lang = languageAt(aura.topLang);
  return (
    <article className="animate-card-in overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="relative h-28 md:h-32" style={{ background: lang.from }} aria-hidden="true">
        <span className="absolute right-4 top-4 rounded-pill bg-white/85 px-3 py-1 font-mono text-[12px] font-medium text-ink">
          {COPY.card.onchain.id(aura.id)}
        </span>
      </div>
      <div className="px-6 pb-6 md:px-8 md:pb-8">
        <div className="relative z-10 -mt-10 flex items-end justify-between gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- avatar GitHub eksternal */}
          <img
            src={avatarUrl(aura.username)}
            alt={`@${aura.username} avatar`}
            width={72}
            height={72}
            className="size-[72px] overflow-hidden rounded-full bg-preview text-[0px] ring-4 ring-white"
          />
          <Badge kind="verified" />
        </div>
        <a
          href={`https://github.com/${aura.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block font-mono text-[14px] text-muted hover:text-ink"
        >
          @{aura.username}
        </a>
        <h1 className="mt-1 text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[34px]">{aura.title}</h1>
        <p className="mt-3 text-[16px] leading-[1.55] text-muted md:text-[17px]">{aura.vibe}</p>

        <dl className="mt-6 grid grid-cols-2 gap-3 text-[14px]">
          <div className="rounded-2xl border border-border bg-bg/50 px-4 py-3">
            <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{COPY.card.onchain.topLanguage}</dt>
            <dd className="mt-1 font-semibold">{lang.name}</dd>
          </div>
          <div className="rounded-2xl border border-border bg-bg/50 px-4 py-3">
            <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{COPY.card.onchain.stamped}</dt>
            <dd className="mt-1 font-semibold">{date.format(new Date(aura.savedAt * 1000))}</dd>
          </div>
        </dl>
        <p className="mt-4 font-mono text-[12px] text-muted">
          {COPY.card.onchain.owner}{" "}
          <a href={explorerAddressUrl(aura.owner)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
            {shortAddress(aura.owner)}
          </a>
        </p>
      </div>
    </article>
  );
}
