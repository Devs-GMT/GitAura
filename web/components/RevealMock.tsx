import { languageAt } from "@/lib/config";
import { Badge } from "./Badge";

// Ilustrasi kartu aura (data contoh). Dekoratif — AuraCard asli dibangun di Fase 7.
const TS = languageAt(1);
const LANGS = [
  { name: "TypeScript", share: 58, color: "#3178C6" },
  { name: "Rust", share: 27, color: "#E8642C" },
  { name: "Go", share: 15, color: "#00ADD8" },
];

export function RevealMock() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute right-6 top-8 w-[300px] max-w-[calc(100%-1.5rem)] overflow-hidden rounded-[24px] border border-border bg-surface shadow-card md:-right-12 md:top-14 md:w-[440px] md:max-w-none">
        <div className="h-24" style={{ background: `linear-gradient(135deg, ${TS.from}, ${TS.to})` }} />
        <div className="px-6 pb-6">
          <div className="-mt-9 flex items-end justify-between">
            <span className="size-[72px] rounded-full bg-gradient-to-br from-voxel-yellow to-voxel-orange ring-4 ring-surface" />
            <Badge kind="preview" />
          </div>
          <p className="mt-3 font-mono text-[13px] text-muted">@octocat</p>
          <p className="mt-1 text-[19px] font-semibold leading-tight md:text-[24px] tracking-[-0.01em]">The Midnight TypeScript Wizard</p>
          <p className="mt-2 text-[14px] text-muted">Ships at 2am, documents at 2pm.</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {["Type-safe", "Night owl", "OSS heart"].map((t) => (
              <span key={t} className="rounded-pill border border-border px-2.5 py-1 text-[12px]">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex h-2 overflow-hidden rounded-pill">
            {LANGS.map((l) => (
              <span key={l.name} style={{ width: `${l.share}%`, background: l.color }} />
            ))}
          </div>
          <div className="mt-2 flex gap-3 font-mono text-[11px] text-muted">
            {LANGS.map((l) => (
              <span key={l.name} className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full" style={{ background: l.color }} />
                {l.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <span className="absolute bottom-12 left-10 hidden h-10 items-center rounded-pill border border-border bg-surface px-4 font-mono text-[13px] shadow-card md:inline-flex">
        Sensing the aura…<span className="ml-1 text-accent">▉</span>
      </span>
    </div>
  );
}
