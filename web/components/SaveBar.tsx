"use client";

import { useEffect, useRef, useState } from "react";
import { explorerTxUrl } from "@/lib/config";
import { COPY } from "@/lib/copy";
import { classifyWalletError, saveAuraOnChain, type Attestation } from "@/lib/wallet";
import { GitHubButton } from "./GitHubButton";

type Wallet = {
  address: string | null;
  hasWallet: boolean;
  onRightChain: boolean;
  connect: () => Promise<string>;
  switchChain: () => Promise<void>;
};

type SaveBarProps = {
  signedIn: boolean;
  isOwn: boolean;
  wallet: Wallet;
  input: { title: string; vibe: string; topLang: number };
  onSaved: (id: bigint, txHash: string) => void;
};

type ErrKind = "rejected" | "proof_expired" | "failed" | "rate_limited" | "signed_out" | "wrong_chain";

const ERR_TEXT: Record<Exclude<ErrKind, "signed_out">, string> = {
  rejected: COPY.errors.txRejected,
  proof_expired: COPY.errors.proofExpired,
  failed: COPY.errors.txFailed,
  rate_limited: COPY.errors.serverRateLimited,
  wrong_chain: COPY.errors.switchChain,
};

const PENDING_HINT_MS = 20_000;

class ApiError extends Error {
  constructor(public status: number) {
    super(`attest ${status}`);
  }
}

async function fetchProof(wallet: string): Promise<Attestation> {
  const res = await fetch("/api/auth/attest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet }),
  });
  if (!res.ok) throw new ApiError(res.status);
  return res.json();
}

const PINK = "inline-flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-accent px-6 text-[16px] font-semibold text-white transition-[filter] duration-200 ease-out hover:brightness-95 disabled:cursor-wait disabled:opacity-80 sm:w-auto";

export function SaveBar({ signedIn, isOwn, wallet, input, onSaved }: SaveBarProps) {
  const [step, setStep] = useState<number | null>(null); // indeks COPY.save.steps saat bekerja
  const [error, setError] = useState<ErrKind | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const slowTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => () => void (slowTimer.current && clearTimeout(slowTimer.current)), []);

  if (!signedIn) {
    return <GitHubButton label={COPY.save.signInToSave} />;
  }
  if (!isOwn) {
    return <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-[14px] text-muted">{COPY.save.onlyOwn}</p>;
  }
  if (!wallet.hasWallet) {
    return (
      <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className={PINK}>
        {COPY.errors.installMetaMask}
      </a>
    );
  }

  const busy = step !== null;

  async function run(action: "connect" | "switch" | "save") {
    setError(null);
    setSlow(false);
    try {
      if (action === "connect") {
        setStep(0);
        await wallet.connect();
        return;
      }
      if (action === "switch") {
        setStep(0);
        await wallet.switchChain();
        return;
      }
      const result = await saveAuraOnChain(input, {
        getProof: fetchProof,
        onStep: (s, hash) => {
          setStep(s === "proof" ? 1 : s === "confirm" ? 2 : 3);
          if (hash) {
            setTxHash(hash);
            slowTimer.current = setTimeout(() => setSlow(true), PENDING_HINT_MS);
          }
        },
      });
      onSaved(result.id, result.txHash);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 401 ? "signed_out" : err.status === 429 ? "rate_limited" : "failed");
      } else {
        const kind = classifyWalletError(err);
        setError(kind === "rejected" ? "rejected" : kind === "proof_expired" ? "proof_expired" : kind === "wrong_chain" ? "wrong_chain" : "failed");
      }
    } finally {
      if (slowTimer.current) clearTimeout(slowTimer.current);
      setStep(null);
      setSlow(false);
    }
  }

  if (error === "signed_out") return <GitHubButton label={COPY.save.signInToSave} />;

  const action: "connect" | "switch" | "save" = !wallet.address ? "connect" : !wallet.onRightChain ? "switch" : "save";
  const label = busy
    ? COPY.save.steps[step!]
    : action === "connect"
      ? COPY.save.steps[0]
      : action === "switch"
        ? COPY.errors.switchChain
        : error
          ? COPY.errors.retry
          : COPY.save.save;

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-[12px]" aria-label="Save progress">
        {COPY.save.steps.map((s, i) => {
          const done = (busy && i < step!) || (!busy && i === 0 && !!wallet.address && wallet.onRightChain);
          const active = busy && i === step;
          return (
            <li key={s} className={`inline-flex items-center gap-1.5 ${active ? "text-ink" : done ? "text-success" : "text-muted"}`}>
              <span className={`inline-block size-2 rounded-full ${active ? "bg-accent" : done ? "bg-success" : "bg-border"}`} />
              {s.replace("…", "")}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="button" className={PINK} disabled={busy} onClick={() => run(action)} aria-busy={busy}>
          {busy && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
          {label}
        </button>
        {slow && txHash && (
          <a href={explorerTxUrl(txHash)} target="_blank" rel="noopener noreferrer" className="text-[14px] text-muted underline underline-offset-4">
            {COPY.errors.txPending}
          </a>
        )}
      </div>

      {error && (
        <p role="alert" className="text-[14px] text-danger">
          {ERR_TEXT[error]}
        </p>
      )}
    </div>
  );
}
