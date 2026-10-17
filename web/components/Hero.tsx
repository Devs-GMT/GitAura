"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { topLangIndex } from "@/lib/config";
import { COPY } from "@/lib/copy";
import { fallbackAura } from "@/lib/fallback";
import { fetchGitHubStats, GitHubError, toAuraRequest, type GitHubStats } from "@/lib/github";
import { clampBytes } from "@/lib/share";
import { AuraCard, type AuraText } from "./AuraCard";
import { Eyebrow } from "./Eyebrow";
import { LoginBanner } from "./LoginBanner";
import { PixelSparkles } from "./PixelSparkles";
import { PromptBox } from "./PromptBox";
import { SaveBar } from "./SaveBar";
import { SuccessPanel } from "./SuccessPanel";
import type { SessionUser } from "./useSession";
import type { useWallet } from "./useWallet";

type Result = { stats: GitHubStats; aura: AuraText; topLang: number };
type Saved = { id: bigint; txHash: string };

// Ticker 3 kalimat × 900ms — tahan loading minimal ini agar ticker terbaca.
const MIN_LOADING_MS = 1800;

const GH_ERRORS: Record<GitHubError["kind"], string> = {
  invalid: COPY.errors.invalidUsername,
  not_found: COPY.errors.userNotFound,
  rate_limited: COPY.errors.githubRateLimited,
  network: COPY.errors.githubRateLimited,
};

class RateLimited extends Error {}

async function generate(stats: GitHubStats): Promise<AuraText> {
  try {
    const res = await fetch("/api/aura", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toAuraRequest(stats)),
    });
    if (res.status === 429) throw new RateLimited();
    if (!res.ok) throw new Error(`aura ${res.status}`);
    return (await res.json()) as AuraText;
  } catch (err) {
    if (err instanceof RateLimited) throw err;
    // Server/AI tidak terjangkau → template lokal (badge "classic aura").
    return { ...fallbackAura(stats), source: stats.publicRepos === 0 ? "fresh" : "fallback" };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type HeroProps = {
  user: SessionUser | null;
  sessionLoading: boolean;
  wallet: ReturnType<typeof useWallet>;
};

export function Hero({ user, sessionLoading, wallet }: HeroProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [loginFailed, setLoginFailed] = useState(false);
  const autoRevealed = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  const reveal = useCallback(async (username: string) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    setSaved(null);
    try {
      const [stats] = await Promise.all([fetchGitHubStats(username), sleep(MIN_LOADING_MS)]);
      const aura = await generate(stats);
      if (id !== requestId.current) return;
      setResult({ stats, aura, topLang: topLangIndex(stats.topLanguages[0]?.name) });
    } catch (err) {
      if (id !== requestId.current) return;
      setError(
        err instanceof GitHubError
          ? GH_ERRORS[err.kind]
          : err instanceof RateLimited
            ? COPY.errors.serverRateLimited
            : COPY.errors.githubRateLimited,
      );
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // ?login=ok|failed dari callback OAuth → tampilkan banner, lalu bersihkan URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const login = params.get("login");
    if (!login) return;
    if (login === "failed") setLoginFailed(true);
    params.delete("login");
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
  }, []);

  // Setelah login: langsung baca aura milik sendiri (sekali per kunjungan).
  useEffect(() => {
    if (sessionLoading || !user || autoRevealed.current || result || loading) return;
    autoRevealed.current = true;
    void reveal(user.login);
  }, [sessionLoading, user, result, loading, reveal]);

  // Gulir halus ke kartu saat hasil muncul.
  useEffect(() => {
    if (!result || !resultRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultRef.current.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, [result]);

  const isOwn = !!user && !!result && user.login === result.stats.login;

  return (
    <section className="relative overflow-hidden">
      <PixelSparkles corner="top-left" size={240} className="opacity-90 max-md:hidden" />
      <PixelSparkles corner="bottom-right" size={280} rotate={-8} className="max-md:h-auto max-md:w-[150px]" />

      <div className="container-page relative flex flex-col items-center py-[72px] text-center md:py-[120px]">
        <Eyebrow>{COPY.hero.eyebrow}</Eyebrow>
        <h1 className="mt-5 max-w-[14ch] text-[44px] font-semibold leading-none tracking-[-0.03em] md:text-[80px]">
          {COPY.hero.title}
        </h1>
        <p className="mt-6 max-w-[620px] text-[16px] leading-[1.55] text-muted md:text-[18px]">{COPY.hero.subtitle}</p>

        <div id="peek" className="mt-10 flex w-full max-w-[640px] scroll-mt-24 flex-col gap-4 text-left">
          {loginFailed && <LoginBanner onDismiss={() => setLoginFailed(false)} />}
          <PromptBox loading={loading} error={error} onPeek={reveal} showSignIn={!user && !sessionLoading} />
        </div>

        {result && !loading && (
          <div ref={resultRef} className="mt-10 flex w-full max-w-[640px] scroll-mt-24 flex-col gap-4 text-left">
            <AuraCard stats={result.stats} aura={result.aura} topLang={result.topLang} badge={saved ? "verified" : "preview"} />
            {saved ? (
              <SuccessPanel id={saved.id} txHash={saved.txHash} title={result.aura.title} />
            ) : (
              <SaveBar
                signedIn={!!user}
                isOwn={isOwn}
                wallet={wallet}
                input={{
                  // Kontrak membatasi BYTE (title ≤80, vibe ≤160).
                  title: clampBytes(result.aura.title, 80),
                  vibe: clampBytes(result.aura.vibe, 160),
                  topLang: result.topLang,
                }}
                onSaved={(id, txHash) => setSaved({ id, txHash })}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
