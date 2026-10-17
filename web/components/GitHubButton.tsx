import { COPY } from "@/lib/copy";
import { GitHubMark } from "./GitHubMark";

/** Link biasa (bukan fetch) — OAuth butuh navigasi penuh ke GitHub. */
export function GitHubButton({ href = "/api/auth/github/login", label = COPY.hero.signIn }: { href?: string; label?: string }) {
  return (
    <a
      href={href}
      className="inline-flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] bg-ink px-6 text-[16px] font-semibold text-white transition-colors duration-200 ease-out hover:bg-black/85"
    >
      <GitHubMark className="size-5" />
      {label}
    </a>
  );
}
