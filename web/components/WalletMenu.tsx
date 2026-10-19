"use client";

import { useEffect, useRef, useState } from "react";
import { CHAIN } from "@/lib/config";
import { COPY } from "@/lib/copy";
import { shortAddress } from "@/lib/format";

type WalletMenuProps = {
  address: string;
  onSwitch: () => void;
  onDisconnect: () => void;
  onCopied: () => void;
};

const ITEM = "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] hover:bg-bg";

/** Pill alamat pendek → dropdown: Copy address · Switch wallet · Disconnect. */
export function WalletMenu({ address, onSwitch, onDisconnect, onCopied }: WalletMenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      onCopied();
    } catch {
      window.prompt(COPY.nav.walletMenu.copyAddress, address);
    }
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={COPY.nav.walletMenu.label}
        className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-accent pl-4 pr-3 text-[14px] font-semibold text-white transition-[filter] duration-200 ease-out hover:brightness-95"
      >
        <span className="font-mono">{shortAddress(address)}</span>
        <svg viewBox="0 0 12 12" className={`size-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M3 4.5 6 7.5l3-3" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-11 z-50 w-60 animate-fade-in rounded-2xl border border-border bg-surface p-1.5 shadow-card">
          <div className="px-3 pb-2 pt-2.5">
            <p className="font-mono text-[13px] text-ink">{shortAddress(address)}</p>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] text-muted">
              <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
              {CHAIN.name}
            </p>
          </div>
          <div className="my-1 h-px bg-border" />
          <button type="button" role="menuitem" className={ITEM} onClick={pick(copy)}>
            {COPY.nav.walletMenu.copyAddress}
          </button>
          <button type="button" role="menuitem" className={ITEM} onClick={pick(onSwitch)}>
            {COPY.nav.walletMenu.switchWallet}
          </button>
          <button type="button" role="menuitem" className={`${ITEM} text-danger`} onClick={pick(onDisconnect)}>
            {COPY.nav.walletMenu.disconnect}
          </button>
        </div>
      )}
    </div>
  );
}
