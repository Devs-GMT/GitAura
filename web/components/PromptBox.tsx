"use client";

import { useState, type FormEvent } from "react";
import { COPY } from "@/lib/copy";
import { normalizeUsername } from "@/lib/github";
import { Chip } from "./Chip";
import { Divider } from "./Divider";
import { GitHubButton } from "./GitHubButton";
import { TickerText } from "./TickerText";

type PromptBoxProps = {
  loading?: boolean;
  /** Pesan error di bawah input (teks dari COPY.errors). */
  error?: string | null;
  onPeek: (username: string) => void;
  /** Disembunyikan saat user sudah login (tombol diganti aksi lain di Fase 7). */
  showSignIn?: boolean;
};

export function PromptBox({ loading = false, error = null, onPeek, showSignIn = true }: PromptBoxProps) {
  const [value, setValue] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const shownError = localError ?? error;

  function submit(e: FormEvent) {
    e.preventDefault();
    const username = normalizeUsername(value);
    if (!username) return setLocalError(COPY.errors.invalidUsername);
    setLocalError(null);
    onPeek(username);
  }

  return (
    <div className="relative w-full rounded-card border border-border bg-surface p-6 shadow-[var(--shadow-card),var(--shadow-glow)] md:p-8">
      {loading ? (
        <div className="flex min-h-[188px] items-center justify-center">
          <TickerText lines={COPY.ticker} />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {showSignIn && (
            <>
              <GitHubButton />
              <Divider label={COPY.hero.divider} />
            </>
          )}

          <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex h-[52px] min-w-0 shrink-0 items-center sm:flex-1 rounded-[14px] border border-border bg-bg/60 px-4 focus-within:border-accent">
                <span className="shrink-0 font-mono text-[15px] text-muted">{COPY.hero.inputPrefix}</span>
                <input
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    if (localError) setLocalError(null);
                  }}
                  placeholder={COPY.hero.inputPlaceholder}
                  aria-label="GitHub username"
                  aria-invalid={!!shownError}
                  aria-describedby={shownError ? "peek-error" : undefined}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 bg-transparent font-mono text-[15px] text-ink outline-none placeholder:text-muted/60"
                />
              </label>
              <button
                type="submit"
                className="inline-flex h-[52px] items-center justify-center rounded-[14px] bg-accent px-7 text-[16px] font-semibold text-ink transition-[filter] duration-200 ease-out hover:brightness-95"
              >
                {COPY.hero.peek}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                {COPY.hero.chips.map((c) => (
                  <Chip key={c} mono>
                    {c}
                  </Chip>
                ))}
              </div>
              {shownError && (
                <p id="peek-error" role="alert" className="text-[14px] text-danger">
                  {shownError}
                </p>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
