"use client";

import { getAddress } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import { CHAIN } from "@/lib/config";
import { ensureChain, getInjected, requestAccount, WalletError } from "@/lib/wallet";

// Disconnect dari sisi dApp diingat per browser agar `eth_accounts` tidak menyambung ulang otomatis.
const OFF_KEY = "ga_wallet_off";
const readOff = () => {
  try {
    return localStorage.getItem(OFF_KEY) === "1";
  } catch {
    return false;
  }
};
const writeOff = (off: boolean) => {
  try {
    if (off) localStorage.setItem(OFF_KEY, "1");
    else localStorage.removeItem(OFF_KEY);
  } catch {
    /* storage diblokir — cukup state di memori */
  }
};

/** Akun & chain MetaMask; mendengarkan accountsChanged / chainChanged. */
export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [hasWallet, setHasWallet] = useState(false);
  const off = useRef(false);

  useEffect(() => {
    const eth = getInjected();
    setHasWallet(!!eth);
    if (!eth) return;
    off.current = readOff();

    const onAccounts = (accs: unknown) => {
      if (off.current) return;
      const a = (accs as string[])?.[0];
      setAddress(a ? getAddress(a) : null);
    };
    const onChain = (id: unknown) => setChainId(Number.parseInt(String(id), 16));

    // Pulihkan tanpa popup (kecuali user memilih Disconnect sebelumnya).
    eth.request({ method: "eth_accounts" }).then(onAccounts).catch(() => {});
    eth.request({ method: "eth_chainId" }).then(onChain).catch(() => {});
    eth.on?.("accountsChanged", onAccounts);
    eth.on?.("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const resume = useCallback((a: string) => {
    off.current = false;
    writeOff(false);
    setAddress(a);
  }, []);

  /** Connect + pastikan chain benar. Lempar WalletError (no_wallet / rejected / wrong_chain). */
  const connect = useCallback(async () => {
    if (!getInjected()) throw new WalletError("no_wallet");
    const a = await requestAccount();
    resume(a);
    await ensureChain();
    setChainId(CHAIN.id);
    return a;
  }, [resume]);

  const switchChain = useCallback(async () => {
    await ensureChain();
    setChainId(CHAIN.id);
  }, []);

  /** Buka pemilih akun MetaMask (wallet_requestPermissions) lalu pakai akun yang dipilih. */
  const switchAccount = useCallback(async () => {
    const eth = getInjected();
    if (!eth) throw new WalletError("no_wallet");
    await eth.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] });
    const accs = (await eth.request({ method: "eth_accounts" })) as string[];
    if (!accs?.[0]) throw new WalletError("rejected");
    resume(getAddress(accs[0]));
    await ensureChain();
    setChainId(CHAIN.id);
  }, [resume]);

  /** Putuskan dApp dari wallet. `wallet_revokePermissions` bila didukung; selalu lupakan akun di sisi app. */
  const disconnect = useCallback(async () => {
    off.current = true;
    writeOff(true);
    setAddress(null);
    try {
      await getInjected()?.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
    } catch {
      /* wallet lama tidak mendukung revoke — status putus tetap berlaku di app */
    }
  }, []);

  return { address, chainId, hasWallet, onRightChain: chainId === CHAIN.id, connect, switchChain, switchAccount, disconnect };
}
