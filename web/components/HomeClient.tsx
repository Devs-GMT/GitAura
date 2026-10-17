"use client";

import { Hero } from "./Hero";
import { SiteHeader } from "./SiteHeader";
import { useSession } from "./useSession";
import { useWallet } from "./useWallet";

/** State bersama (session + wallet) untuk NavBar dan Hero; section statis lewat `children`. */
export function HomeClient({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const wallet = useWallet();

  return (
    <>
      <SiteHeader session={session} wallet={wallet} />
      <main>
        <Hero user={session.user} sessionLoading={session.loading} wallet={wallet} />
        {children}
      </main>
    </>
  );
}
