"use client";

import { SiteHeader } from "./SiteHeader";
import { useSession } from "./useSession";
import { useWallet } from "./useWallet";

/** Header untuk halaman selain landing (galeri, share). */
export function StandaloneHeader() {
  return <SiteHeader session={useSession()} wallet={useWallet()} />;
}
