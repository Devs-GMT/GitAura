"use client";

import { useEffect, useState } from "react";
import { LANGUAGES, languageAt } from "@/lib/config";
import { COPY } from "@/lib/copy";
import type { GitHubStats } from "@/lib/github";
import type { ContribWeeks } from "@/lib/contrib";
import { Badge, type BadgeKind } from "./Badge";
import { ContribBanner } from "./ContribBanner";

export type AuraText = {
  title: string;
  vibe: string;
  traits: readonly string[];
  source: "ai" | "fallback" | "fresh";
};

type AuraCardProps = {
  stats: GitHubStats;
  aura: AuraText;
  topLang: number;
  badge: Extract<BadgeKind, "verified" | "preview">;
};

const fmt = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

const OTHER_COLOR = "#B9B4AB";

function langColor(name: string): string {
  return LANGUAGES.find((l) => l.name === name)?.from ?? "#5E5B55";
}

export function AuraCard({ stats, aura, topLang, badge }: AuraCardProps) {
  const lang = languageAt(topLang);
  const [weeks, setWeeks] = useState<ContribWeeks | null>(null);
  useEffect(() => {
    let alive = true;
    setWeeks(null);
    fetch(`/api/contrib/${encodeURIComponent(stats.login)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { weeks: ContribWeeks | null } | null) => alive && setWeeks(d?.weeks ?? null))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [stats.login]);
  // share = porsi dari SEMUA repo berbahasa; sisa di luar top 3 ditampilkan sebagai "Other" agar bar = 100%.
  const rest = 1 - stats.topLanguages.reduce((s, l) => s + l.share, 0);
  const segments = [
    ...stats.topLanguages.map((l) => ({ ...l, color: langColor(l.name) })),
    ...(rest >= 0.01 ? [{ name: LANGUAGES[0].name, share: rest, color: OTHER_COLOR }] : []),
  ];
  const handle = stats.displayLogin || stats.login;
  const statItems = [
    [COPY.card.stats.repos, fmt.format(stats.publicRepos)],
    [COPY.card.stats.followers, fmt.format(stats.followers)],
    [COPY.card.stats.stars, fmt.format(stats.totalStars)],
    [COPY.card.stats.mostStarred, stats.mostStarred?.name ?? "—"],
  ] as const;

  return (
    <article className="animate-card-in overflow-hidden rounded-card border border-border bg-surface shadow-card">
      {/* Banner: warna bahasa teratas + grid commit GitHub user. */}
      <ContribBanner color={lang.from} weeks={weeks} />

      <div className="px-6 pb-6 md:px-8 md:pb-8">
        <div className="relative z-10 -mt-10 flex items-end justify-between gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- avatar GitHub eksternal */}
          <img
            src={stats.avatarUrl}
            alt={`@${handle} avatar`}
            width={72}
            height={72}
            className="size-[72px] overflow-hidden rounded-full bg-preview text-[0px] ring-4 ring-white"
          />
          <div className="flex flex-wrap justify-end gap-1.5">
            <Badge kind={badge} />
            {aura.source === "fallback" && <Badge kind="classic" />}
          </div>
        </div>

        <a
          href={stats.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block font-mono text-[14px] text-muted hover:text-ink"
        >
          @{handle}
        </a>
        <h3 className="mt-1 text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[34px]">{aura.title}</h3>
        <p className="mt-3 text-[16px] leading-[1.55] text-muted md:text-[17px]">{aura.vibe}</p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {aura.traits.map((t) => (
            <li key={t} className="inline-flex h-8 items-center rounded-pill border border-border bg-surface px-3 text-[13px] font-medium">
              {t}
            </li>
          ))}
        </ul>

        <dl className="mt-6 grid grid-cols-2 gap-3">
          {statItems.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-border bg-bg/50 px-4 py-3">
              <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{label}</dt>
              <dd className="mt-1 truncate text-[18px] font-semibold" title={String(value)}>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {stats.topLanguages.length > 0 && (
          <div className="mt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{COPY.card.languages}</p>
            <div className="mt-2 flex h-2.5 gap-px overflow-hidden rounded-pill bg-border">
              {segments.map((l) => (
                // flex-grow proporsional → total selalu 100%; min 4px agar bahasa kecil tetap terlihat.
                <span key={l.name} className="min-w-1" style={{ flexGrow: l.share, background: l.color }} />
              ))}
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[12px] text-muted">
              {segments.map((l) => (
                <li key={l.name} className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: l.color }} />
                  {l.name} {Math.round(l.share * 100)}%
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
