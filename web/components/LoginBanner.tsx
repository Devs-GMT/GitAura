import { COPY } from "@/lib/copy";

/** `?login=failed` — batal / gagal / state mismatch (UI_COPY §Errors). */
export function LoginBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div role="alert" className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/30 bg-surface px-4 py-3 text-left text-[14px]">
      <span className="text-danger">{COPY.errors.loginFailed}</span>
      <span className="flex items-center gap-3">
        <a href="/api/auth/github/login" className="font-semibold text-ink underline underline-offset-4">
          {COPY.errors.tryAgain}
        </a>
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="text-muted hover:text-ink">
          ✕
        </button>
      </span>
    </div>
  );
}
