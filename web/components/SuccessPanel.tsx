"use client";

import { useState } from "react";
import { explorerTxUrl } from "@/lib/config";
import { COPY } from "@/lib/copy";
import { auraShareUrl, tweetIntentUrl } from "@/lib/share";
import { Badge } from "./Badge";
import { Toast } from "./Toast";

const BTN = "inline-flex h-11 items-center justify-center rounded-[12px] px-4 text-[14px] font-semibold";

export function SuccessPanel({ id, txHash, title }: { id: bigint; txHash: string; title: string }) {
  const [toast, setToast] = useState<string | null>(null);
  const url = auraShareUrl(id);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link", url);
      return;
    }
    setToast(COPY.save.copied);
  }

  return (
    <div className="rounded-card border border-accent/40 bg-accent-soft/40 p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-[24px] font-semibold tracking-[-0.02em]">{COPY.save.success(id.toString())}</h3>
        <Badge kind="verified" />
      </div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <a href={explorerTxUrl(txHash)} target="_blank" rel="noopener noreferrer" className={`${BTN} border border-border bg-surface text-ink hover:border-ink`}>
          {COPY.save.viewTx}
        </a>
        <button type="button" onClick={copy} className={`${BTN} border border-border bg-surface text-ink hover:border-ink`}>
          {COPY.save.copyLink}
        </button>
        <a href={tweetIntentUrl(title, url)} target="_blank" rel="noopener noreferrer" className={`${BTN} bg-accent text-white hover:brightness-95`}>
          {COPY.save.shareX}
        </a>
      </div>
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
