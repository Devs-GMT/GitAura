import { GitHubMark } from "./GitHubMark";

// Ilustrasi layar izin OAuth (generik, bukan salinan UI GitHub). Dekoratif.
export function SignInMock() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute left-6 top-8 w-[300px] max-w-[calc(100%-1.5rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-card md:-bottom-10 md:left-12 md:top-auto md:w-[460px] md:max-w-none">
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="ml-3 truncate font-mono text-[11px] text-muted">oauth · authorize</span>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center gap-3">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-ink text-white">
              <GitHubMark className="size-6" />
            </span>
            <span className="font-mono text-muted">⇄</span>
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-[18px] font-semibold">
              G<span className="text-accent">•</span>
            </span>
          </div>
          <p className="mt-5 text-center text-[17px] font-semibold">Authorize GitAura</p>
          <ul className="mt-5 space-y-2.5 text-[13px]">
            {["Read your public profile", "No private repos", "No write access"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="inline-flex size-4 items-center justify-center rounded-full bg-success text-[10px] text-white">✓</span>
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-6 h-10 rounded-[12px] bg-ink" />
          <div className="mt-3 h-10 rounded-[12px] border border-border" />
        </div>
      </div>

      <span className="absolute right-8 top-10 hidden h-10 items-center gap-2 rounded-pill border border-border bg-surface pl-1.5 pr-4 font-mono text-[13px] shadow-card md:inline-flex">
        <span className="size-7 rounded-full bg-gradient-to-br from-[#3178C6] to-accent" />
        @you
      </span>
    </div>
  );
}
