"use client";

import { useState } from "react";
import { COPY } from "@/lib/copy";
import { shortAddress } from "@/lib/format";
import { classifyWalletError } from "@/lib/wallet";
import { NavBar } from "./NavBar";
import { Toast } from "./Toast";
import type { useSession } from "./useSession";
import type { useWallet } from "./useWallet";

type SiteHeaderProps = {
  session: ReturnType<typeof useSession>;
  wallet: ReturnType<typeof useWallet>;
};

/** NavBar yang tersambung ke session & wallet (label alamat pendek / switch chain / install MetaMask). */
export function SiteHeader({ session, wallet }: SiteHeaderProps) {
  const [toast, setToast] = useState<string | null>(null);

  const walletLabel = !wallet.address
    ? COPY.nav.connectWallet
    : !wallet.onRightChain
      ? COPY.errors.switchChain
      : shortAddress(wallet.address);

  async function onWalletClick() {
    if (!wallet.hasWallet) {
      window.open("https://metamask.io/download/", "_blank", "noopener,noreferrer");
      return;
    }
    try {
      if (!wallet.address) await wallet.connect();
      else if (!wallet.onRightChain) await wallet.switchChain();
    } catch (err) {
      const kind = classifyWalletError(err);
      setToast(kind === "wrong_chain" ? COPY.errors.switchChain : kind === "no_wallet" ? COPY.errors.installMetaMask : null);
    }
  }

  return (
    <>
      <NavBar user={session.user} walletLabel={walletLabel} onWalletClick={onWalletClick} onSignOut={session.signOut} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
