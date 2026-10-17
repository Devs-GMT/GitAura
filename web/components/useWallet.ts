"use client";

import { getAddress } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { CHAIN } from "@/lib/config";
import { ensureChain, getInjected, requestAccount, WalletError } from "@/lib/wallet";

/** Akun & chain MetaMask; mendengarkan accountsChanged / chainChanged. */
export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    const eth = getInjected();
    setHasWallet(!!eth);
    if (!eth) return;

    const onAccounts = (accs: unknown) => {
      const a = (accs as string[])?.[0];
      setAddress(a ? getAddress(a) : null);
    };
    const onChain = (id: unknown) => setChainId(Number.parseInt(String(id), 16));

    // Pulihkan tanpa popup.
    eth.request({ method: "eth_accounts" }).then(onAccounts).catch(() => {});
    eth.request({ method: "eth_chainId" }).then(onChain).catch(() => {});
    eth.on?.("accountsChanged", onAccounts);
    eth.on?.("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, []);

  /** Connect + pastikan chain benar. Lempar WalletError (no_wallet / rejected / wrong_chain). */
  const connect = useCallback(async () => {
    if (!getInjected()) throw new WalletError("no_wallet");
    const a = await requestAccount();
    setAddress(a);
    await ensureChain();
    setChainId(CHAIN.id);
    return a;
  }, []);

  const switchChain = useCallback(async () => {
    await ensureChain();
    setChainId(CHAIN.id);
  }, []);

  return { address, chainId, hasWallet, onRightChain: chainId === CHAIN.id, connect, switchChain };
}
