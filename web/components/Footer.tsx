import { CHAIN_ID, CONTRACT_ADDRESS, explorerAddressUrl } from "@/lib/config";
import { COPY } from "@/lib/copy";
import { shortAddress } from "@/lib/format";
import { Eyebrow } from "./Eyebrow";
import { TypedText } from "./TypedText";
import { Voxels } from "./Voxels";

const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const;

export function Footer() {
  return (
    <footer className="relative overflow-hidden pb-28 pt-[72px] md:pb-10 md:pt-[120px]">
      <Voxels corner="bottom-left" size={240} className="opacity-90 max-md:w-[150px]" />
      <Voxels corner="bottom-right" size={240} rotate={6} className="max-md:w-[150px]" />

      <div className="container-page relative">
        <Eyebrow>{COPY.footer.eyebrow}</Eyebrow>

        <div className="mt-5 rounded-card border border-border bg-surface p-6 shadow-[var(--shadow-card),var(--shadow-glow)] md:p-8">
          <div className="min-h-[72px] md:min-h-[96px]">
            <TypedText text={COPY.footer.typed(CHAIN_ID)} />
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <a
              href="https://botchain.ai"
              {...EXTERNAL}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-pill border border-border bg-surface px-4 text-[14px] font-medium hover:border-ink"
            >
              {/* TODO(PROGRESS): ganti dengan logo BOT Chain resmi (SVG) */}
              <span className="inline-block size-3 bg-ink" aria-hidden="true" />
              {COPY.footer.chip}
            </a>
            {CONTRACT_ADDRESS && (
              <span
                className="inline-flex h-10 items-center justify-center rounded-pill bg-preview px-4 font-mono text-[13px] text-muted"
                title={CONTRACT_ADDRESS}
              >
                {shortAddress(CONTRACT_ADDRESS)}
              </span>
            )}
            {CONTRACT_ADDRESS && (
              <a
                href={explorerAddressUrl(CONTRACT_ADDRESS)}
                {...EXTERNAL}
                className="inline-flex h-10 items-center justify-center rounded-pill bg-accent px-5 text-[14px] font-semibold text-white hover:brightness-95"
              >
                {COPY.footer.explorer}
              </a>
            )}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between gap-4 text-[13px]">
          <span>{COPY.footer.copyright}</span>
          <span className="text-muted">{COPY.footer.disclaimer}</span>
        </div>
      </div>
    </footer>
  );
}
