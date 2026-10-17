"use client";

import { useState } from "react";
import { COPY } from "@/lib/copy";
import { shortAddress } from "@/lib/format";
import { classifyWalletError } from "@/lib/wallet";
import { Hero } from "./Hero";
import { NavBar } from "./NavBar";
import { Toast } from "./Toast";
import { useSession } from "./useSession";
import { useWallet } from "./useWallet";

/** State bersama (session + wallet) untuk NavBar dan Hero; section statis lewat `children`. */
export function HomeClient({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const wallet = useWallet();
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
      <main>
        <Hero user={session.user} sessionLoading={session.loading} wallet={wallet} />
        {children}
      </main>
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
