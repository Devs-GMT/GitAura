"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COPY } from "@/lib/copy";
import { Logo } from "./Logo";

export type NavUser = { login: string; avatar: string };

type NavBarProps = {
  user?: NavUser | null;
  /** Label tombol wallet: "Connect wallet" atau alamat pendek setelah connect. */
  walletLabel?: string;
  onWalletClick?: () => void;
  onSignOut?: () => void;
};

export function NavBar({ user, walletLabel = COPY.nav.connectWallet, onWalletClick, onSignOut }: NavBarProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/80 backdrop-blur">
      <nav className="container-page flex h-16 items-center justify-between gap-3" aria-label="Main">
        <Logo />

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-5 pr-2 text-[14px] text-muted md:flex">
            <Link href="/gallery" className="hover:text-ink">
              {COPY.nav.gallery}
            </Link>
            <Link href="/#how-it-works" className="hover:text-ink">
              {COPY.nav.howItWorks}
            </Link>
          </div>

          {user && (
            <div className="hidden items-center gap-2 md:flex">
              <span className="inline-flex h-9 items-center gap-2 rounded-pill border border-border bg-surface pl-1 pr-3 font-mono text-[13px]">
                {/* eslint-disable-next-line @next/next/no-img-element -- avatar GitHub eksternal, kecil */}
                <img src={user.avatar} alt={`@${user.login} avatar`} className="size-7 rounded-full" width={28} height={28} />
                {COPY.nav.avatarChip(user.login)}
              </span>
              <button type="button" onClick={onSignOut} className="text-[14px] text-muted hover:text-ink">
                {COPY.nav.signOut}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onWalletClick}
            className="inline-flex h-9 items-center rounded-pill bg-accent px-4 text-[14px] font-semibold text-ink transition-[filter] duration-200 ease-out hover:brightness-95"
          >
            <span className={walletLabel.startsWith("0x") ? "font-mono" : ""}>{walletLabel}</span>
          </button>

          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-surface md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-border bg-surface md:hidden">
          <div className="container-page flex flex-col py-2 text-[16px]">
            {user && (
              <span className="flex items-center gap-2 py-3 font-mono text-[14px]">
                {/* eslint-disable-next-line @next/next/no-img-element -- avatar GitHub eksternal, kecil */}
                <img src={user.avatar} alt={`@${user.login} avatar`} className="size-7 rounded-full" width={28} height={28} />
                {COPY.nav.avatarChip(user.login)}
              </span>
            )}
            <Link href="/gallery" className="py-3" onClick={() => setOpen(false)}>
              {COPY.nav.gallery}
            </Link>
            <Link href="/#how-it-works" className="py-3" onClick={() => setOpen(false)}>
              {COPY.nav.howItWorks}
            </Link>
            {user && (
              <button
                type="button"
                className="py-3 text-left text-muted"
                onClick={() => {
                  setOpen(false);
                  onSignOut?.();
                }}
              >
                {COPY.nav.signOut}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
