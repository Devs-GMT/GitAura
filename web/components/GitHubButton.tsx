import { COPY } from "@/lib/copy";
import { GitHubMark } from "./GitHubMark";

type GitHubButtonProps = { href?: string; label?: string; compact?: boolean };

/** Link biasa (bukan fetch) — OAuth butuh navigasi penuh ke GitHub. */
export function GitHubButton({ href = "/api/auth/github/login", label = COPY.hero.signIn, compact = false }: GitHubButtonProps) {
  const size = compact ? "h-10 gap-2 rounded-[12px] px-4 text-[14px]" : "min-h-[52px] w-full gap-3 rounded-[14px] px-6 py-3 text-center text-[16px] leading-snug";
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center bg-ink font-semibold text-white transition-colors duration-200 ease-out hover:bg-black/85 ${size}`}
    >
      <GitHubMark className={compact ? "size-4" : "size-5"} />
      {label}
    </a>
  );
}
